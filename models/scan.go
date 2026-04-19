package models

// ScanRequest is the incoming request body for POST /api/scan
type ScanRequest struct {
	URL string `json:"url"`
}

// ScanResult is the response returned after scanning
type ScanResult struct {
	Status         string            `json:"status"`
	URL            string            `json:"url"`
	FoundEndpoints []string          `json:"found_endpoints"`
	Headers        map[string]string `json:"headers"`
	DNSResults     []string          `json:"dns_results"`
	ScanDuration   string            `json:"scan_duration"`
	Error          string            `json:"error,omitempty"`
}

// ErrorResponse is a generic error response
type ErrorResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}
