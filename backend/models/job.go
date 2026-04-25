package models

import (
	"time"
)

// JobStatus คือสถานะของ scan job
type JobStatus string

const (
	JobStatusPending    JobStatus = "pending"
	JobStatusProcessing JobStatus = "processing"
	JobStatusDone       JobStatus = "done"
	JobStatusFailed     JobStatus = "failed"
)

// Job เก็บ state ใน Redis
type Job struct {
	ID        string      `json:"id"`
	URL       string      `json:"url"`
	IPAddress string      `json:"ip_address"`
	Status    JobStatus   `json:"status"`
	Auth      *AuthConfig `json:"auth,omitempty"`
	Result    *ScanResult `json:"result,omitempty"`
	Error     string      `json:"error,omitempty"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}
