package models

import (
	"time"

	"gorm.io/gorm"
)

type ScanHistory struct {
	ID              uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	URL             string `gorm:"type:text;not null"       json:"url"`
	Status          string `gorm:"type:varchar(20)"         json:"status"`
	FoundEndpoints  int    `gorm:"default:0"                json:"found_endpoints_count"`
	DNSResultsCount int    `gorm:"default:0"                json:"dns_results_count"`
	ScanDuration    string `gorm:"type:varchar(20)"         json:"scan_duration"`
	ResultJSON      string `gorm:"type:jsonb"               json:"result_json"`
	IPAddress       string `gorm:"type:varchar(45)"         json:"ip_address"`
	// Phase 3 — เพิ่มใหม่
	JobID             string         `gorm:"type:varchar(36);index"   json:"job_id"`
	JSEndpointsCount  int            `gorm:"default:0"                json:"js_endpoints_count"`
	NetworkCallsCount int            `gorm:"default:0"                json:"network_calls_count"`
	ScanMode          string         `gorm:"type:varchar(20);default:'basic'" json:"scan_mode"` // basic | deep
	CreatedAt         time.Time      `                                json:"created_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index"                    json:"-"`
}

func MigrateDB(db *gorm.DB) error {
	return db.AutoMigrate(&ScanHistory{})
}
