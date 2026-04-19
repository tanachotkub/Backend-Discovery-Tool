package services

import (
	"backend-discovery/models"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"
)

// ValidateURL prevents SSRF by blocking private/internal URLs
func ValidateURL(rawURL string) error {
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

	// Block localhost variants
	blockedHosts := []string{"localhost", "127.0.0.1", "::1", "0.0.0.0"}
	for _, blocked := range blockedHosts {
		if host == blocked {
			return fmt.Errorf("scanning localhost is not allowed")
		}
	}

	// Block private IP ranges (SSRF protection)
	ip := net.ParseIP(host)
	if ip != nil {
		privateRanges := []string{
			"10.0.0.0/8",
			"172.16.0.0/12",
			"192.168.0.0/16",
			"169.254.0.0/16", // link-local
			"100.64.0.0/10",  // shared address space
			"fc00::/7",       // IPv6 unique local
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

// FetchHTML fetches page HTML and interesting response headers
func FetchHTML(targetURL string) (string, map[string]string, error) {
	client := &http.Client{
		Timeout: 10 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			// Prevent open redirect to internal network
			if err := ValidateURL(req.URL.String()); err != nil {
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

	resp, err := client.Do(req)
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	// Limit response to 5MB
	body, err := io.ReadAll(io.LimitReader(resp.Body, 5*1024*1024))
	if err != nil {
		return "", nil, err
	}

	// Collect tech-revealing headers
	headers := map[string]string{}
	interesting := []string{"server", "x-powered-by", "via", "x-framework", "x-runtime", "x-generator", "x-aspnet-version"}
	for _, h := range interesting {
		if val := resp.Header.Get(h); val != "" {
			headers[h] = val
		}
	}

	return string(body), headers, nil
}

// ScanEndpoints extracts API endpoints from HTML content using regex
func ScanEndpoints(html string) []string {
	seen := map[string]bool{}
	var results []string

	add := func(s string) {
		s = strings.TrimRight(s, ".,;:)'\"\\")
		if s != "" && !seen[s] {
			seen[s] = true
			results = append(results, s)
		}
	}

	apiKeywords := []string{"api", "graphql", "gql", "rest", "v1", "v2", "v3", "endpoint", "backend", "service"}

	// 1. Full URLs containing API keywords
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

	// 2. Relative paths like /api/users, /v1/login
	pathRe := regexp.MustCompile(`["'/]((?:api|graphql|gql|rest|v[0-9]+)/[^\s"'<>{}\[\]\\]{2,120})["'/]`)
	for _, m := range pathRe.FindAllStringSubmatch(html, -1) {
		if len(m) > 1 {
			add("/" + strings.TrimLeft(m[1], "/"))
		}
	}

	// 3. fetch() / axios() / xhr.open() calls
	fetchRe := regexp.MustCompile(`(?:fetch|axios(?:\.[a-z]+)?|xhr\.open)\s*\(\s*["` + "`" + `'](https?://[^"` + "`" + `']+|/[^"` + "`" + `']{2,120})["` + "`" + `']`)
	for _, m := range fetchRe.FindAllStringSubmatch(html, -1) {
		if len(m) > 1 {
			add(m[1])
		}
	}

	return results
}

// DNSLookup probes common API subdomains
func DNSLookup(domain string) []string {
	probes := []string{"api", "backend", "service", "services", "gateway", "gw", "rest", "graphql", "grpc", "internal"}
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

// Scan orchestrates the full scan pipeline
func Scan(targetURL string) models.ScanResult {
	start := time.Now()

	if err := ValidateURL(targetURL); err != nil {
		return models.ScanResult{
			Status: "error",
			URL:    targetURL,
			Error:  err.Error(),
		}
	}

	parsed, _ := url.Parse(targetURL)
	domain := parsed.Hostname()

	html, headers, err := FetchHTML(targetURL)
	if err != nil {
		return models.ScanResult{
			Status: "error",
			URL:    targetURL,
			Error:  fmt.Sprintf("failed to fetch: %s", err.Error()),
		}
	}

	endpoints := ScanEndpoints(html)
	dnsResults := DNSLookup(domain)

	return models.ScanResult{
		Status:         "success",
		URL:            targetURL,
		FoundEndpoints: endpoints,
		Headers:        headers,
		DNSResults:     dnsResults,
		ScanDuration:   fmt.Sprintf("%.2fs", time.Since(start).Seconds()),
	}
}
