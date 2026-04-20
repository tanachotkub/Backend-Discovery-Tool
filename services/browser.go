package services

import (
	"fmt"
	"strings"
	"time"

	"github.com/playwright-community/playwright-go"
)

type BrowserScanner struct{}

type BrowserResult struct {
	NetworkCalls []string // XHR/Fetch ที่ดักได้
	JSEndpoints  []string // endpoint ที่หาจาก JS files
}

func InstallBrowser() error {
	return playwright.Install(&playwright.RunOptions{
		Browsers: []string{"chromium"},
	})
}

// ScanWithBrowser เปิดเว็บจริงด้วย Playwright แล้วดักจับ network requests
func (b BrowserScanner) ScanWithBrowser(targetURL string) (BrowserResult, error) {
	// Install browsers ถ้ายังไม่มี
	// if err := playwright.Install(&playwright.RunOptions{
	// 	Browsers: []string{"chromium"},
	// }); err != nil {
	// 	return BrowserResult{}, fmt.Errorf("failed to install playwright: %w", err)
	// }

	pw, err := playwright.Run()
	if err != nil {
		return BrowserResult{}, fmt.Errorf("failed to start playwright: %w", err)
	}
	defer pw.Stop()

	// Launch headless chromium
	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(true),
	})
	if err != nil {
		return BrowserResult{}, fmt.Errorf("failed to launch browser: %w", err)
	}
	defer browser.Close()

	page, err := browser.NewPage()
	if err != nil {
		return BrowserResult{}, fmt.Errorf("failed to create page: %w", err)
	}

	var networkCalls []string
	seen := map[string]bool{}

	apiKeywords := []string{"api", "graphql", "gql", "rest", "v1", "v2", "v3", "backend", "service"}

	// ดักจับ network requests ทั้งหมด
	page.On("request", func(req playwright.Request) {
		url := req.URL()
		lower := strings.ToLower(url)

		for _, kw := range apiKeywords {
			if strings.Contains(lower, kw) && !seen[url] {
				seen[url] = true
				networkCalls = append(networkCalls, url)
				break
			}
		}
	})

	// เปิด URL พร้อม timeout 15s
	_, err = page.Goto(targetURL, playwright.PageGotoOptions{
		Timeout:   playwright.Float(15000),
		WaitUntil: playwright.WaitUntilStateNetworkidle,
	})
	if err != nil {
		return BrowserResult{}, fmt.Errorf("failed to navigate: %w", err)
	}

	// รอให้ JS โหลดและ execute เพิ่มอีกนิด
	time.Sleep(2 * time.Second)

	// ดึง JS file URLs จากหน้าเว็บ แล้วสแกนต่อ
	jsEndpoints, _ := b.scanJSFiles(page, targetURL)

	return BrowserResult{
		NetworkCalls: networkCalls,
		JSEndpoints:  jsEndpoints,
	}, nil
}

// scanJSFiles ดึง <script src="..."> แล้วโหลด JS มาหา endpoint
func (b BrowserScanner) scanJSFiles(page playwright.Page, baseURL string) ([]string, error) {
	// ดึง script src ทั้งหมด
	scripts, err := page.Evaluate(`
        Array.from(document.querySelectorAll('script[src]'))
             .map(s => s.src)
             .filter(s => s.startsWith('http'))
             .slice(0, 10)  // จำกัดแค่ 10 files
    `)
	if err != nil {
		return nil, err
	}

	scriptURLs, ok := scripts.([]interface{})
	if !ok {
		return nil, nil
	}

	var allEndpoints []string
	seen := map[string]bool{}
	scanner := ScannerService{}

	for _, s := range scriptURLs {
		scriptURL, ok := s.(string)
		if !ok {
			continue
		}

		// Validate ก่อน fetch ป้องกัน SSRF
		if err := scanner.ValidateURL(scriptURL); err != nil {
			continue
		}

		// Fetch JS file content
		jsContent, _, err := scanner.FetchHTML(scriptURL)
		if err != nil {
			continue
		}

		// Scan หา endpoints ใน JS
		endpoints := scanner.ScanEndpoints(jsContent)
		for _, ep := range endpoints {
			if !seen[ep] {
				seen[ep] = true
				allEndpoints = append(allEndpoints, ep)
			}
		}
	}

	return allEndpoints, nil
}
