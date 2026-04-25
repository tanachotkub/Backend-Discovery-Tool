package models

const (
	ScanModeBasic = "basic"
	ScanModeDeep  = "deep"
)

// AuthConfig สำหรับ Authenticated Scan
type AuthConfig struct {
	Cookies []Cookie          `json:"cookies"` // cookies จาก browser
	Headers map[string]string `json:"headers"` // custom headers เช่น Authorization
}

type Cookie struct {
	Name   string `json:"name"`
	Value  string `json:"value"`
	Domain string `json:"domain,omitempty"`
	Path   string `json:"path,omitempty"`
}

type ScanRequest struct {
	URL      string      `json:"url"`
	DeepScan bool        `json:"deep_scan"`
	Auth     *AuthConfig `json:"auth,omitempty"` // ← เพิ่ม optional
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
	Authenticated  bool              `json:"authenticated"` // ← เพิ่ม
	Error          string            `json:"error,omitempty"`
}

type ErrorResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}
