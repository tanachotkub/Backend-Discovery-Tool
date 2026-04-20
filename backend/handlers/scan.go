package handlers

import (
	"backend-discovery/models"
	"backend-discovery/services"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type ScanHandler struct {
	WorkerPool *services.WorkerPool
}

func (h *ScanHandler) Health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":  "ok",
		"service": "Backend Discovery Tool",
		"version": "2.0.0",
	})
}

// Scan รับ request แล้ว enqueue job → คืน job_id ทันที
func (h *ScanHandler) Scan(c *fiber.Ctx) error {
	var req models.ScanRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "invalid JSON body",
		})
	}

	req.URL = strings.TrimSpace(req.URL)
	if req.URL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "url field is required",
		})
	}

	if !strings.HasPrefix(req.URL, "http://") && !strings.HasPrefix(req.URL, "https://") {
		req.URL = "https://" + req.URL
	}

	// Enqueue job แทนการ scan ตรงๆ
	job, err := h.WorkerPool.EnqueueJob(req.URL, req.DeepScan, c.IP())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "failed to create scan job",
		})
	}

	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{
		"status":    "accepted",
		"job_id":    job.ID,
		"message":   "scan job created, use GET /api/jobs/:id to check status",
		"deep_scan": req.DeepScan,
	})
}
