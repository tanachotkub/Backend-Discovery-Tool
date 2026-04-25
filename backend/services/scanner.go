package services

import (
	"backend-discovery/models"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"gorm.io/gorm"
)

type ScannerService struct {
	DB *gorm.DB // inject จาก main
}

func (s ScannerService) ValidateURL(rawURL string) error {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return fmt.Errorf("invalid URL format")
	}

	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return fmt.Errorf("URL must start with http:// or https://")
	}

	host := parsed.Hostname()
	if host == "" {
		return fmt.Errorf("URL must contain a valid hostname")
	}

	blockedHosts := []string{"localhost", "127.0.0.1", "::1", "0.0.0.0"}
	for _, blocked := range blockedHosts {
		if host == blocked {
			return fmt.Errorf("scanning localhost is not allowed")
		}
	}

	ip := net.ParseIP(host)
	if ip != nil {
		privateRanges := []string{
			"10.0.0.0/8",
			"172.16.0.0/12",
			"192.168.0.0/16",
			"169.254.0.0/16",
			"100.64.0.0/10",
			"fc00::/7",
		}
		for _, cidr := range privateRanges {
			_, network, _ := net.ParseCIDR(cidr)
			if network != nil && network.Contains(ip) {
				return fmt.Errorf("scanning private IP ranges is not allowed")
			}
		}
	}

	return nil
}

func (s ScannerService) FetchHTMLWithAuth(targetURL string, auth *models.AuthConfig) (string, map[string]string, error) {
	client := &http.Client{
		Timeout: 10 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if err := s.ValidateURL(req.URL.String()); err != nil {
				return fmt.Errorf("redirect blocked: %s", err.Error())
			}
			if len(via) >= 3 {
				return fmt.Errorf("too many redirects")
			}
			return nil
		},
	}

	req, err := http.NewRequest(http.MethodGet, targetURL, nil)
	if err != nil {
		return "", nil, err
	}
	req.Header.Set("User-Agent", "BackendDiscovery/1.0 (Security Scanner)")

	// ✅ inject cookies
	if auth != nil {
		for _, c := range auth.Cookies {
			req.AddCookie(&http.Cookie{
				Name:  c.Name,
				Value: c.Value,
			})
			log.Printf("Scanner: added cookie %s to request", c.Name)
		}

		// ✅ inject headers
		for k, v := range auth.Headers {
			req.Header.Set(k, v)
		}
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 5*1024*1024))
	if err != nil {
		return "", nil, err
	}

	headers := map[string]string{}
	interesting := []string{"server", "x-powered-by", "via", "x-framework", "x-runtime", "x-generator"}
	for _, h := range interesting {
		if val := resp.Header.Get(h); val != "" {
			headers[h] = val
		}
	}

	return string(body), headers, nil
}

func (s ScannerService) ScanEndpoints(html string) []string {
	seen := map[string]bool{}
	var results []string

	add := func(str string) {
		str = strings.TrimRight(str, ".,;:)'\"\\")
		if str != "" && !seen[str] {
			seen[str] = true
			results = append(results, str)
		}
	}

	apiKeywords := []string{"api", "graphql", "gql", "rest", "v1", "v2", "v3", "endpoint", "backend", "service"}

	urlRe := regexp.MustCompile(`https?://[^\s"'<>{}\[\]\\|^` + "`" + `]+`)
	for _, u := range urlRe.FindAllString(html, -1) {
		lower := strings.ToLower(u)
		for _, kw := range apiKeywords {
			if strings.Contains(lower, kw) {
				add(u)
				break
			}
		}
	}

	pathRe := regexp.MustCompile(`["'/]((?:api|graphql|gql|rest|v[0-9]+)/[^\s"'<>{}\[\]\\]{2,120})["'/]`)
	for _, m := range pathRe.FindAllStringSubmatch(html, -1) {
		if len(m) > 1 {
			add("/" + strings.TrimLeft(m[1], "/"))
		}
	}

	fetchRe := regexp.MustCompile(`(?:fetch|axios(?:\.[a-z]+)?|xhr\.open)\s*\(\s*["` + "`" + `'](https?://[^"` + "`" + `']+|/[^"` + "`" + `']{2,120})["` + "`" + `']`)
	for _, m := range fetchRe.FindAllStringSubmatch(html, -1) {
		if len(m) > 1 {
			add(m[1])
		}
	}

	return results
}

func (s ScannerService) DNSLookup(domain string) []string {
	probes := []string{"api", "backend", "service", "services", "gateway", "gw", "rest", "graphql"}
	var found []string

	for _, sub := range probes {
		host := sub + "." + domain
		addrs, err := net.LookupHost(host)
		if err == nil && len(addrs) > 0 {
			found = append(found, fmt.Sprintf("%s → %s", host, strings.Join(addrs, ", ")))
		}
	}

	return found
}

// Scan — เพิ่มการบันทึก history
func (s ScannerService) Scan(targetURL string, ipAddress string, auth *models.AuthConfig) models.ScanResult {
	start := time.Now()

	if err := s.ValidateURL(targetURL); err != nil {
		return models.ScanResult{
			Status: "error",
			URL:    targetURL,
			Error:  err.Error(),
		}
	}

	parsed, _ := url.Parse(targetURL)
	domain := parsed.Hostname()

	html, headers, err := s.FetchHTMLWithAuth(targetURL, auth)
	if err != nil {
		return models.ScanResult{
			Status: "error",
			URL:    targetURL,
			Error:  fmt.Sprintf("failed to fetch: %s", err.Error()),
		}
	}

	// result := models.ScanResult{
	return models.ScanResult{
		Status:         "success",
		URL:            targetURL,
		FoundEndpoints: s.ScanEndpoints(html),
		Headers:        headers,
		DNSResults:     s.DNSLookup(domain),
		ScanDuration:   fmt.Sprintf("%.2fs", time.Since(start).Seconds()),
	}

	// // บันทึก history ลง DB (ถ้ามี DB)
	// if s.DB != nil {
	// 	resultJSON, _ := json.Marshal(result)
	// 	history := models.ScanHistory{
	// 		URL:             targetURL,
	// 		Status:          result.Status,
	// 		FoundEndpoints:  len(result.FoundEndpoints),
	// 		DNSResultsCount: len(result.DNSResults),
	// 		ScanDuration:    result.ScanDuration,
	// 		ResultJSON:      string(resultJSON),
	// 		IPAddress:       ipAddress,
	// 	}
	// 	s.DB.Create(&history)
	// }

	// return result
}
