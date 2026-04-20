package models

const (
	ScanModeBasic = "basic"
	ScanModeDeep  = "deep"
)

type ScanRequest struct {
	URL      string `json:"url"`
	DeepScan bool   `json:"deep_scan"`
}

type ScanResult struct {
	Status         string            `json:"status"`
	URL            string            `json:"url"`
	FoundEndpoints []string          `json:"found_endpoints"`
	Headers        map[string]string `json:"headers"`
	DNSResults     []string          `json:"dns_results"`
	ScanDuration   string            `json:"scan_duration"`
	JSEndpoints    []string          `json:"js_endpoints,omitempty"`
	NetworkCalls   []string          `json:"network_calls,omitempty"`
	ScanMode       string            `json:"scan_mode"`
	Error          string            `json:"error,omitempty"`
}

type ErrorResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}
