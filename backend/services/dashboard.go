package services

import (
	"backend-discovery/models"
	"time"

	"gorm.io/gorm"
)

type DashboardService struct {
	DB *gorm.DB
}

type DashboardStats struct {
	// Summary cards
	TotalScans      int64   `json:"total_scans"`
	TotalEndpoints  int64   `json:"total_endpoints"`
	SuccessRate     float64 `json:"success_rate"`
	AvgScanDuration string  `json:"avg_scan_duration"`

	// Basic vs Deep
	BasicScans int64 `json:"basic_scans"`
	DeepScans  int64 `json:"deep_scans"`

	// Scan per day (7 วันย้อนหลัง)
	ScanPerDay []ScanPerDay `json:"scan_per_day"`

	// Top 5 URLs
	TopURLs []TopURL `json:"top_urls"`

	// Endpoint type breakdown
	TotalHTMLEndpoints int64 `json:"total_html_endpoints"`
	TotalDNSResults    int64 `json:"total_dns_results"`
	TotalJSEndpoints   int64 `json:"total_js_endpoints"`
	TotalNetworkCalls  int64 `json:"total_network_calls"`
}

type ScanPerDay struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}

type TopURL struct {
	URL   string `json:"url"`
	Count int64  `json:"count"`
}

func (s DashboardService) GetStats(days int) (DashboardStats, error) {
	var stats DashboardStats

	// กำหนด range วัน
	if days <= 0 {
		days = 7
	}

	// Total scans
	s.DB.Model(&models.ScanHistory{}).Count(&stats.TotalScans)

	// Basic vs Deep
	s.DB.Model(&models.ScanHistory{}).Where("scan_mode = ?", "basic").Count(&stats.BasicScans)
	s.DB.Model(&models.ScanHistory{}).Where("scan_mode = ?", "deep").Count(&stats.DeepScans)

	// Success rate
	var successCount int64
	s.DB.Model(&models.ScanHistory{}).Where("status = ?", "success").Count(&successCount)
	if stats.TotalScans > 0 {
		stats.SuccessRate = float64(successCount) / float64(stats.TotalScans) * 100
	}

	// Total endpoints รวมทุกประเภท
	var htmlSum, dnsSum, jsSum, netSum *int64
	s.DB.Model(&models.ScanHistory{}).Select("sum(found_endpoints)").Scan(&htmlSum)
	s.DB.Model(&models.ScanHistory{}).Select("sum(dns_results_count)").Scan(&dnsSum)
	s.DB.Model(&models.ScanHistory{}).Select("sum(js_endpoints_count)").Scan(&jsSum)
	s.DB.Model(&models.ScanHistory{}).Select("sum(network_calls_count)").Scan(&netSum)

	if htmlSum != nil {
		stats.TotalHTMLEndpoints = *htmlSum
	}
	if dnsSum != nil {
		stats.TotalDNSResults = *dnsSum
	}
	if jsSum != nil {
		stats.TotalJSEndpoints = *jsSum
	}
	if netSum != nil {
		stats.TotalNetworkCalls = *netSum
	}

	stats.TotalEndpoints = stats.TotalHTMLEndpoints + stats.TotalDNSResults +
		stats.TotalJSEndpoints + stats.TotalNetworkCalls

	// แก้ตรง Scan per day ให้ใช้ days แทน 7
	for i := days - 1; i >= 0; i-- {
		date := time.Now().AddDate(0, 0, -i)
		dateStr := date.Format("2006-01-02")
		var count int64
		s.DB.Model(&models.ScanHistory{}).
			Where("DATE(created_at) = ?", dateStr).
			Count(&count)
		stats.ScanPerDay = append(stats.ScanPerDay, ScanPerDay{
			Date:  date.Format("02 Jan"),
			Count: count,
		})
	}

	// Top 5 URLs ที่ scan บ่อยสุด
	type urlCount struct {
		URL   string
		Count int64
	}
	var topURLs []urlCount
	s.DB.Model(&models.ScanHistory{}).
		Select("url, count(*) as count").
		Group("url").
		Order("count desc").
		Limit(5).
		Scan(&topURLs)

	for _, u := range topURLs {
		stats.TopURLs = append(stats.TopURLs, TopURL{
			URL:   u.URL,
			Count: u.Count,
		})
	}

	return stats, nil
}
