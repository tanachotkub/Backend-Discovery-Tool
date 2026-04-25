package services

import (
	"backend-discovery/models"
	"context"
	"fmt"
	"log"
	"net/url"
	"strings"
	"time"

	"github.com/chromedp/cdproto/network"
	"github.com/chromedp/chromedp"
)

type BrowserConfig struct {
	Headless bool
}

type BrowserScanner struct {
	Config BrowserConfig
}

type BrowserResult struct {
	NetworkCalls []string
	JSEndpoints  []string
}

func NewBrowserScanner(headless bool) BrowserScanner {
	return BrowserScanner{Config: BrowserConfig{Headless: headless}}
}

func InstallBrowser(config BrowserConfig) error {
	log.Printf("✅ Browser scanner ready (headless: %v)", config.Headless)
	return nil
}

// ScanWithBrowser — basic deep scan ไม่มี auth
func (b BrowserScanner) ScanWithBrowser(targetURL string) (BrowserResult, error) {
	return b.ScanWithAuth(targetURL, nil)
}

// ScanWithAuth — deep scan พร้อม inject cookies/headers
func (b BrowserScanner) ScanWithAuth(targetURL string, auth *models.AuthConfig) (BrowserResult, error) {
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", b.Config.Headless),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("disable-blink-features", "AutomationControlled"),
		chromedp.UserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"),
	)

	allocCtx, cancelAlloc := chromedp.NewExecAllocator(context.Background(), opts...)
	defer cancelAlloc()

	ctx, cancelCtx := chromedp.NewContext(allocCtx)
	defer cancelCtx()

	ctx, cancelTimeout := context.WithTimeout(ctx, 30*time.Second)
	defer cancelTimeout()

	var networkCalls []string
	seen := map[string]bool{}
	// apiKeywords := []string{"api", "graphql", "gql", "rest", "v1", "v2", "v3", "backend", "service"}

	// ✅ Step 1 — เปิด URL เพื่อให้ browser รู้จัก domain ก่อน
	// จากนั้น inject cookies แล้ว reload
	actions := []chromedp.Action{
		// Stealth ก่อนเสมอ
		chromedp.ActionFunc(func(ctx context.Context) error {
			return chromedp.Evaluate(`
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                window.chrome = { runtime: {} };
            `, nil).Do(ctx)
		}),

		// ✅ Navigate ไป about:blank ก่อน เพื่อ enable network
		chromedp.Navigate("about:blank"),
	}

	// ✅ Step 2 — Inject cookies ก่อน navigate จริง
	if auth != nil && len(auth.Cookies) > 0 {
		actions = append(actions, chromedp.ActionFunc(func(ctx context.Context) error {
			parsedURL, err := url.Parse(targetURL)
			if err != nil {
				return err
			}

			if err := network.Enable().Do(ctx); err != nil {
				return err
			}

			for _, c := range auth.Cookies {
				domain := c.Domain
				if domain == "" {
					domain = parsedURL.Hostname()
				}
				path := c.Path
				if path == "" {
					path = "/"
				}

				err := network.SetCookie(c.Name, c.Value).
					WithDomain(domain).
					WithPath(path).
					WithHTTPOnly(false).
					WithSecure(parsedURL.Scheme == "https").
					Do(ctx)
				if err != nil {
					log.Printf("Warning: failed to set cookie %s: %v", c.Name, err)
				}
			}

			log.Printf("Browser: injected %d cookies", len(auth.Cookies))
			return nil
		}))
	}

	// ✅ Step 3 — Navigate จริงหลัง inject cookies แล้ว
	actions = append(actions,
		chromedp.Navigate(targetURL),
		chromedp.WaitReady("body", chromedp.ByQuery),
		chromedp.Sleep(3*time.Second),
	)

	// ✅ Step 3.5 — เช็ค cookies ที่ active อยู่ (debug)
	actions = append(actions, chromedp.ActionFunc(func(ctx context.Context) error {
		cookies, err := network.GetCookies().Do(ctx)
		if err != nil {
			return err
		}
		log.Printf("Browser: active cookies after navigate: %d", len(cookies))
		for _, c := range cookies {
			valuePreview := c.Value
			if len(valuePreview) > 10 {
				valuePreview = valuePreview[:10] + "..."
			}
			log.Printf("  → %s = %s (domain: %s)", c.Name, valuePreview, c.Domain)
		}
		return nil
	}))

	// ✅ Step 4 — inject custom headers ถ้ามี
	if auth != nil && len(auth.Headers) > 0 {
		actions = append(actions, chromedp.ActionFunc(func(ctx context.Context) error {
			headers := network.Headers{}
			for k, v := range auth.Headers {
				headers[k] = v
			}
			return network.SetExtraHTTPHeaders(headers).Do(ctx)
		}))
	}

	// ✅ Step 5 — capture network calls
	var performanceEntries interface{}
	actions = append(actions, chromedp.Evaluate(`
        (function() {
            var entries = window.performance.getEntriesByType("resource");
            var keywords = ["api", "graphql", "gql", "rest", "v1", "v2", "v3", "backend", "service"];
            var result = [];
            entries.forEach(function(e) {
                var lower = e.name.toLowerCase();
                var type = e.initiatorType;
                if (type !== "xmlhttprequest" && type !== "fetch") return;
                for (var i = 0; i < keywords.length; i++) {
                    if (lower.indexOf(keywords[i]) !== -1) {
                        result.push("[" + type.toUpperCase() + "] " + e.name);
                        break;
                    }
                }
            });
            return result;
        })()
    `, &performanceEntries))

	if err := chromedp.Run(ctx, actions...); err != nil {
		return BrowserResult{}, fmt.Errorf("browser scan failed: %w", err)
	}

	// Parse results
	if entries, ok := performanceEntries.([]interface{}); ok {
		for _, e := range entries {
			if s, ok := e.(string); ok && !seen[s] {
				seen[s] = true
				networkCalls = append(networkCalls, s)
			}
		}
	}

	log.Printf("Browser: network_calls captured: %d (auth: %v)", len(networkCalls), auth != nil)

	jsEndpoints, _ := b.scanJSFiles(ctx, targetURL, auth)
	log.Printf("Browser: js_endpoints found: %d", len(jsEndpoints))

	return BrowserResult{
		NetworkCalls: networkCalls,
		JSEndpoints:  jsEndpoints,
	}, nil
}

func (b BrowserScanner) scanJSFiles(ctx context.Context, baseURL string, auth *models.AuthConfig) ([]string, error) {
	var scriptURLs []string

	err := chromedp.Run(ctx,
		chromedp.Evaluate(`
            Array.from(document.querySelectorAll('script[src]'))
                .map(s => s.src)
                .filter(s => s.startsWith('http'))
                .slice(0, 10)
        `, &scriptURLs),
	)
	if err != nil {
		return nil, err
	}

	var allEndpoints []string
	seen := map[string]bool{}
	scanner := ScannerService{}
	parsedBase, _ := url.Parse(baseURL)

	for _, scriptURL := range scriptURLs {
		if err := scanner.ValidateURL(scriptURL); err != nil {
			continue
		}
		jsContent, _, err := scanner.FetchHTMLWithAuth(scriptURL, auth)
		if err != nil {
			continue
		}
		endpoints := scanner.ScanEndpoints(jsContent)
		for _, ep := range endpoints {
			if strings.HasPrefix(ep, "/") {
				ep = parsedBase.Scheme + "://" + parsedBase.Host + ep
			}
			if !seen[ep] {
				seen[ep] = true
				allEndpoints = append(allEndpoints, ep)
			}
		}
	}

	return allEndpoints, nil
}
