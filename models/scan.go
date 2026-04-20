package models

// ScanRequest is the incoming request body for POST /api/scan
type ScanRequest struct {
	URL      string `json:"url"`
	DeepScan bool   `json:"deep_scan"` // Phase 3: true = ใช้ Playwright
}

// ScanResult is the response returned after scanning
type ScanResult struct {
	Status         string            `json:"status"`
	URL            string            `json:"url"`
	FoundEndpoints []string          `json:"found_endpoints"`
	Headers        map[string]string `json:"headers"`
	DNSResults     []string          `json:"dns_results"`
	ScanDuration   string            `json:"scan_duration"`
	// Phase 3 — เพิ่มใหม่
	JSEndpoints  []string `json:"js_endpoints,omitempty"`  // จาก JS files
	NetworkCalls []string `json:"network_calls,omitempty"` // จาก Playwright
	ScanMode     string   `json:"scan_mode"`               // basic | deep
	Error        string   `json:"error,omitempty"`
}

// ErrorResponse is a generic error response
type ErrorResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}
