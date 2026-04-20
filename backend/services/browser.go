package services

import (
	"backend-discovery/models"
	"fmt"
	"log"
	"net/url"
	"strings"
	"time"

	"github.com/tebeka/selenium"
	"github.com/tebeka/selenium/chrome"
)

type BrowserConfig struct {
	DriverPath string
	Port       int
}

type BrowserScanner struct {
	Config BrowserConfig
}

type BrowserResult struct {
	NetworkCalls []string
	JSEndpoints  []string
}

// NewBrowserScanner สร้าง BrowserScanner พร้อม config
func NewBrowserScanner(driverPath string, port int) BrowserScanner {
	return BrowserScanner{
		Config: BrowserConfig{
			DriverPath: driverPath,
			Port:       port,
		},
	}
}

// ScanWithBrowser เปิด Edge จริงๆ แล้วดักจับ network requests
func (b BrowserScanner) ScanWithBrowser(targetURL string) (BrowserResult, error) {
	// ตั้งค่า Edge options พร้อม stealth mode
	caps := selenium.Capabilities{
		"browserName": "MicrosoftEdge",
	}

	chromeCaps := chrome.Capabilities{
		Args: []string{
			"--headless", // ไม่แสดงหน้าต่าง
			"--no-sandbox",
			"--disable-dev-shm-usage",
			"--disable-gpu",
			"--window-size=1280,720",
			"--disable-blink-features=AutomationControlled", // ซ่อน automation flag
			"--disable-infobars",
			"--disable-extensions",
			"--disable-web-security",
			"--log-level=3", // ลด log noise
		},
		ExcludeSwitches: []string{
			"enable-automation", // ซ่อน "Chrome is being controlled" bar
		},
		W3C: false,
	}

	caps.AddChrome(chromeCaps)

	// Start EdgeDriver service
	service, err := selenium.NewChromeDriverService(
		b.Config.DriverPath,
		b.Config.Port,
	)
	if err != nil {
		return BrowserResult{}, fmt.Errorf("failed to start EdgeDriver: %w", err)
	}
	defer service.Stop()

	// Connect to WebDriver
	wd, err := selenium.NewRemote(caps, fmt.Sprintf("http://localhost:%d/wd/hub", b.Config.Port))
	if err != nil {
		return BrowserResult{}, fmt.Errorf("failed to connect to WebDriver: %w", err)
	}
	defer wd.Quit()

	// Stealth scripts — ซ่อน automation signature ก่อนโหลดหน้า
	stealthScript := `
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5]
        });
        Object.defineProperty(navigator, 'languages', {
            get: () => ['th-TH', 'th', 'en-US', 'en']
        });
        window.chrome = { runtime: {} };
    `

	// Enable network logging ผ่าน Chrome DevTools Protocol
	// ✅ ถูก — รับครบ 2 ค่า (_, err) เพราะไม่ได้ใช้ผลลัพธ์จาก script
	if _, err := wd.ExecuteScript(stealthScript, nil); err != nil {
		log.Printf("Browser: stealth script warning: %v", err)
	}
	// เปิด URL
	log.Printf("Browser: navigating to %s", targetURL)
	if err := wd.Get(targetURL); err != nil {
		return BrowserResult{}, fmt.Errorf("failed to navigate: %w", err)
	}

	// รอให้ JS โหลดครบ
	time.Sleep(3 * time.Second)

	// รอ page ready state
	if err := b.waitForPageLoad(wd); err != nil {
		log.Printf("Browser: page load warning: %v", err)
	}

	// ดึง network calls จาก Performance API (built-in browser API)
	networkCalls, err := b.captureNetworkCalls(wd)
	if err != nil {
		log.Printf("Browser: network capture warning: %v", err)
	}
	log.Printf("Browser: network_calls captured: %d", len(networkCalls))

	// ดึง JS files แล้ว scan หา endpoints
	jsEndpoints, err := b.scanJSFiles(wd, targetURL)
	if err != nil {
		log.Printf("Browser: js scan warning: %v", err)
	}
	log.Printf("Browser: js_endpoints found: %d", len(jsEndpoints))

	return BrowserResult{
		NetworkCalls: networkCalls,
		JSEndpoints:  jsEndpoints,
	}, nil
}

// waitForPageLoad รอให้ document.readyState เป็น complete
func (b BrowserScanner) waitForPageLoad(wd selenium.WebDriver) error {
	timeout := time.After(15 * time.Second)
	tick := time.NewTicker(500 * time.Millisecond)
	defer tick.Stop()

	for {
		select {
		case <-timeout:
			return fmt.Errorf("page load timeout")
		case <-tick.C:
			result, err := wd.ExecuteScript(`return document.readyState`, nil)
			if err != nil {
				continue
			}
			if result == "complete" {
				return nil
			}
		}
	}
}

// captureNetworkCalls ใช้ Performance API ดักจับ API calls
func (b BrowserScanner) captureNetworkCalls(wd selenium.WebDriver) ([]string, error) {
	// ใช้ window.performance.getEntriesByType("resource")
	// เป็น browser built-in API ที่บันทึก network requests ทุกตัว
	script := `
        var entries = window.performance.getEntriesByType("resource");
        var apiCalls = [];
        var keywords = ["api", "graphql", "gql", "rest", "v1", "v2", "v3", "backend", "service"];
        
        entries.forEach(function(entry) {
            var url = entry.name.toLowerCase();
            var initiatorType = entry.initiatorType;
            
            // กรองเฉพาะ xhr และ fetch
            if (initiatorType !== "xmlhttprequest" && initiatorType !== "fetch") {
                return;
            }
            
            for (var i = 0; i < keywords.length; i++) {
                if (url.indexOf(keywords[i]) !== -1) {
                    apiCalls.push("[" + initiatorType.toUpperCase() + "] " + entry.name);
                    break;
                }
            }
        });
        
        return apiCalls;
    `

	result, err := wd.ExecuteScript(script, nil)
	if err != nil {
		return nil, fmt.Errorf("performance API error: %w", err)
	}

	// แปลง interface{} → []string
	raw, ok := result.([]interface{})
	if !ok {
		return nil, nil
	}

	var calls []string
	for _, item := range raw {
		if s, ok := item.(string); ok {
			calls = append(calls, s)
		}
	}

	return calls, nil
}

// scanJSFiles ดึง script tags แล้วโหลด JS มาหา endpoints
func (b BrowserScanner) scanJSFiles(wd selenium.WebDriver, baseURL string) ([]string, error) {
	// ดึง script src ทั้งหมดจากหน้าเว็บ
	script := `
        return Array.from(document.querySelectorAll('script[src]'))
            .map(s => s.src)
            .filter(s => s.startsWith('http'))
            .slice(0, 10);
    `

	result, err := wd.ExecuteScript(script, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get script tags: %w", err)
	}

	raw, ok := result.([]interface{})
	if !ok {
		return nil, nil
	}

	var allEndpoints []string
	seen := map[string]bool{}
	scanner := ScannerService{}

	// Parse base domain สำหรับ resolve relative URLs
	parsedBase, _ := url.Parse(baseURL)

	for _, item := range raw {
		scriptURL, ok := item.(string)
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
			// Resolve relative path
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

// InstallBrowser ไม่จำเป็นสำหรับ Selenium แต่เก็บไว้ให้ main.go เรียกได้
func InstallBrowser(config BrowserConfig) error {
	log.Printf("✅ Using EdgeDriver at: %s (port: %d)", config.DriverPath, config.Port)
	return nil
}

// ScanMode บอกว่า deep scan ทำอะไรเพิ่มบ้าง
func (b BrowserScanner) ScanMode() string {
	return models.ScanModeDeep
}
