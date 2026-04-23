package services

import (
	"context"
	"fmt"
	"log"
	"net/url"
	"strings"
	"time"

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
	return BrowserScanner{
		Config: BrowserConfig{Headless: headless},
	}
}

func InstallBrowser(config BrowserConfig) error {
	log.Printf("✅ Browser scanner ready (headless: %v)", config.Headless)
	return nil
}

func (b BrowserScanner) ScanWithBrowser(targetURL string) (BrowserResult, error) {
	// Options สำหรับ Chromium
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", b.Config.Headless),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("disable-blink-features", "AutomationControlled"),
		chromedp.Flag("disable-infobars", true),
		chromedp.Flag("window-size", "1280,720"),
		chromedp.UserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"),
	)

	allocCtx, cancelAlloc := chromedp.NewExecAllocator(context.Background(), opts...)
	defer cancelAlloc()

	ctx, cancelCtx := chromedp.NewContext(allocCtx)
	defer cancelCtx()

	// Timeout รวม 30 วินาที
	ctx, cancelTimeout := context.WithTimeout(ctx, 30*time.Second)
	defer cancelTimeout()

	var networkCalls []string
	seen := map[string]bool{}
	// apiKeywords := []string{"api", "graphql", "gql", "rest", "v1", "v2", "v3", "backend", "service"}

	// // ดักจับ network requests ผ่าน Performance API
	// var performanceEntries []map[string]interface{}

	err := chromedp.Run(ctx,
		// Stealth script
		chromedp.ActionFunc(func(ctx context.Context) error {
			return chromedp.Evaluate(`
                Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                window.chrome = { runtime: {} };
            `, nil).Do(ctx)
		}),

		// เปิด URL
		chromedp.Navigate(targetURL),

		// รอ page โหลด
		chromedp.WaitReady("body", chromedp.ByQuery),

		// รอ JS execute เพิ่ม
		chromedp.Sleep(3*time.Second),

		// ดึง network calls จาก Performance API
		chromedp.Evaluate(`
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
        `, &networkCalls),
	)

	if err != nil {
		return BrowserResult{}, fmt.Errorf("browser scan failed: %w", err)
	}

	// กรอง network calls
	var filteredCalls []string
	for _, call := range networkCalls {
		if !seen[call] {
			seen[call] = true
			filteredCalls = append(filteredCalls, call)
		}
	}

	log.Printf("Browser: network_calls captured: %d", len(filteredCalls))

	// Scan JS files
	jsEndpoints, _ := b.scanJSFiles(ctx, targetURL)
	log.Printf("Browser: js_endpoints found: %d", len(jsEndpoints))

	return BrowserResult{
		NetworkCalls: filteredCalls,
		JSEndpoints:  jsEndpoints,
	}, nil
}

func (b BrowserScanner) scanJSFiles(ctx context.Context, baseURL string) ([]string, error) {
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

		jsContent, _, err := scanner.FetchHTML(scriptURL)
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
