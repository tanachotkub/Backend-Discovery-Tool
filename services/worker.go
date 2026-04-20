package services

import (
	"backend-discovery/models"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

const (
	jobQueueKey  = "scan_jobs:queue"   // Redis List — queue ของ jobs
	jobDataKeyFn = "scan_jobs:data:%s" // Redis Hash — data ของแต่ละ job
	jobTTL       = 24 * time.Hour      // เก็บ job ไว้ 24 ชั่วโมง
)

type WorkerPool struct {
	DB          *gorm.DB
	RedisClient *redis.Client
	WorkerCount int
	scanner     ScannerService
	browser     BrowserScanner
}

func NewWorkerPool(db *gorm.DB, rdb *redis.Client, workerCount int) *WorkerPool {
	return &WorkerPool{
		DB:          db,
		RedisClient: rdb,
		WorkerCount: workerCount,
		scanner:     ScannerService{DB: db},
		browser:     BrowserScanner{},
	}
}

// EnqueueJob สร้าง job ใหม่และใส่เข้า Redis queue
func (wp *WorkerPool) EnqueueJob(targetURL string, deepScan bool, ipAddress string) (*models.Job, error) {
	ctx := context.Background()

	job := &models.Job{
		ID:        uuid.New().String(),
		URL:       targetURL,
		IPAddress: ipAddress,
		Status:    models.JobStatusPending,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// บันทึก job data ลง Redis
	jobData, err := json.Marshal(job)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal job: %w", err)
	}

	key := fmt.Sprintf(jobDataKeyFn, job.ID)
	if err := wp.RedisClient.Set(ctx, key, jobData, jobTTL).Err(); err != nil {
		return nil, fmt.Errorf("failed to save job: %w", err)
	}

	// ใส่ job ID เข้า queue
	// เก็บ deepScan flag ไว้ใน payload ด้วย
	payload := fmt.Sprintf("%s|%v", job.ID, deepScan)
	if err := wp.RedisClient.RPush(ctx, jobQueueKey, payload).Err(); err != nil {
		return nil, fmt.Errorf("failed to enqueue job: %w", err)
	}

	return job, nil
}

// GetJob ดึง job จาก Redis
func (wp *WorkerPool) GetJob(jobID string) (*models.Job, error) {
	ctx := context.Background()
	key := fmt.Sprintf(jobDataKeyFn, jobID)

	data, err := wp.RedisClient.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return nil, fmt.Errorf("job not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get job: %w", err)
	}

	var job models.Job
	if err := json.Unmarshal(data, &job); err != nil {
		return nil, fmt.Errorf("failed to unmarshal job: %w", err)
	}

	return &job, nil
}

// updateJob อัพเดต job status ใน Redis
func (wp *WorkerPool) updateJob(job *models.Job) error {
	ctx := context.Background()
	key := fmt.Sprintf(jobDataKeyFn, job.ID)
	job.UpdatedAt = time.Now()

	data, err := json.Marshal(job)
	if err != nil {
		return err
	}

	return wp.RedisClient.Set(ctx, key, data, jobTTL).Err()
}

// Start เปิด worker goroutines ตามจำนวน WorkerCount
func (wp *WorkerPool) Start(ctx context.Context) {
	log.Printf("🔧 Starting %d workers...", wp.WorkerCount)

	for i := 0; i < wp.WorkerCount; i++ {
		go wp.runWorker(ctx, i+1)
	}
}

// runWorker คือ goroutine ที่วน loop รับ job จาก queue
func (wp *WorkerPool) runWorker(ctx context.Context, workerID int) {
	log.Printf("Worker #%d started", workerID)

	for {
		select {
		case <-ctx.Done():
			log.Printf("Worker #%d stopped", workerID)
			return
		default:
			// BLPop — block รอจนมี job ใน queue (timeout 5s)
			result, err := wp.RedisClient.BLPop(ctx, 5*time.Second, jobQueueKey).Result()
			if err == redis.Nil {
				continue // timeout, วน loop ใหม่
			}
			if err != nil {
				if ctx.Err() != nil {
					return
				}
				log.Printf("Worker #%d redis error: %v", workerID, err)
				time.Sleep(time.Second)
				continue
			}

			// result[0] = key name, result[1] = payload
			payload := result[1]
			wp.processJob(ctx, workerID, payload)
		}
	}
}

// processJob ทำงานจริง — scan URL แล้วอัพเดต job
// func (wp *WorkerPool) processJob(ctx context.Context, workerID int, payload string) {
// 	// Parse payload: "jobID|deepScan"
// 	var jobID string
// 	var deepScan bool
// 	fmt.Sscanf(payload, "%36s|%t", &jobID, &deepScan)

// 	log.Printf("Worker #%d processing job %s (deep=%v)", workerID, jobID, deepScan)

// 	// ดึง job จาก Redis
// 	job, err := wp.GetJob(jobID)
// 	if err != nil {
// 		log.Printf("Worker #%d failed to get job %s: %v", workerID, jobID, err)
// 		return
// 	}

// 	// อัพเดต status → processing
// 	job.Status = models.JobStatusProcessing
// 	wp.updateJob(job)

// 	var result models.ScanResult

// 	if deepScan {
// 		// Deep scan: Basic scan ก่อน แล้วต่อด้วย Playwright
// 		result = wp.scanner.Scan(job.URL, job.IPAddress)
// 		if result.Status == "success" {
// 			result.ScanMode = "deep"
// 			browserResult, err := wp.browser.ScanWithBrowser(job.URL)
// 			if err != nil {
// 				log.Printf("Worker #%d browser scan failed: %v", workerID, err)
// 			} else {
// 				result.NetworkCalls = browserResult.NetworkCalls
// 				result.JSEndpoints = browserResult.JSEndpoints
// 			}
// 		}
// 	} else {
// 		// Basic scan
// 		result = wp.scanner.Scan(job.URL, job.IPAddress)
// 		result.ScanMode = "basic"
// 	}

// 	// อัพเดต job → done หรือ failed
// 	job.Result = &result
// 	if result.Status == "success" {
// 		job.Status = models.JobStatusDone
// 	} else {
// 		job.Status = models.JobStatusFailed
// 		job.Error = result.Error
// 	}

// 	if err := wp.updateJob(job); err != nil {
// 		log.Printf("Worker #%d failed to update job: %v", workerID, err)
// 	}

// 	log.Printf("Worker #%d completed job %s — status: %s", workerID, jobID, job.Status)
// }

// This `processJob` function is responsible for processing a job retrieved from the Redis queue.
// Here's a breakdown of what it does:
func (wp *WorkerPool) processJob(ctx context.Context, workerID int, payload string) {
	var jobID string
	var deepScan bool
	fmt.Sscanf(payload, "%36s|%t", &jobID, &deepScan)

	job, err := wp.GetJob(jobID)
	if err != nil {
		log.Printf("Worker #%d failed to get job %s: %v", workerID, jobID, err)
		return
	}

	job.Status = models.JobStatusProcessing
	wp.updateJob(job)

	var result models.ScanResult

	if deepScan {
		// Basic scan ก่อน
		result = wp.scanner.Scan(job.URL, job.IPAddress)
		if result.Status == "success" {
			result.ScanMode = "deep"
			// Playwright scan
			browserResult, err := wp.browser.ScanWithBrowser(job.URL)
			if err != nil {
				log.Printf("Worker #%d browser scan failed: %v", workerID, err)
			} else {
				result.NetworkCalls = browserResult.NetworkCalls
				result.JSEndpoints = browserResult.JSEndpoints
			}
		}
	} else {
		result = wp.scanner.Scan(job.URL, job.IPAddress)
		result.ScanMode = "basic"
	}

	// ✅ Save DB ตรงนี้ที่เดียว หลังทุกอย่างเสร็จ
	if wp.DB != nil {
		resultJSON, _ := json.Marshal(result)
		history := models.ScanHistory{
			URL:               job.URL,
			Status:            result.Status,
			FoundEndpoints:    len(result.FoundEndpoints),
			DNSResultsCount:   len(result.DNSResults),
			ScanDuration:      result.ScanDuration,
			ResultJSON:        string(resultJSON),
			IPAddress:         job.IPAddress,
			JobID:             job.ID, // ✅ ใส่ job_id
			JSEndpointsCount:  len(result.JSEndpoints),
			NetworkCallsCount: len(result.NetworkCalls),
			ScanMode:          result.ScanMode, // ✅ ใส่ scan_mode จริง
		}
		wp.DB.Create(&history)
	}

	job.Result = &result
	if result.Status == "success" {
		job.Status = models.JobStatusDone
	} else {
		job.Status = models.JobStatusFailed
		job.Error = result.Error
	}

	wp.updateJob(job)
	log.Printf("Worker #%d completed job %s — status: %s", workerID, jobID, job.Status)
}
