package services

import (
	"backend-discovery/models"
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
)

type PDFService struct{}

func (p PDFService) GenerateScanReport(history models.ScanHistory) ([]byte, error) {
	var result models.ScanResult
	if err := json.Unmarshal([]byte(history.ResultJSON), &result); err != nil {
		return nil, fmt.Errorf("failed to parse result: %w", err)
	}

	html := buildHTML(history, result)

	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-gpu", true),
	)

	allocCtx, cancelAlloc := chromedp.NewExecAllocator(context.Background(), opts...)
	defer cancelAlloc()

	ctx, cancelCtx := chromedp.NewContext(allocCtx)
	defer cancelCtx()

	ctx, cancelTimeout := context.WithTimeout(ctx, 30*time.Second)
	defer cancelTimeout()

	var pdfBuf []byte

	// ✅ footer template พร้อม page number
	footerTemplate := `
		<div style="
			width: 100%;
			font-size: 9px;
			color: #94a3b8;
			font-family: Arial, sans-serif;
			display: flex;
			justify-content: space-between;
			padding: 0 15mm;
			box-sizing: border-box;
		">
			<span>Backend Discovery Tool &nbsp;|&nbsp; For educational purposes only</span>
			<span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
		</div>
	`

	if err := chromedp.Run(ctx,
		chromedp.Navigate("about:blank"),
		chromedp.ActionFunc(func(ctx context.Context) error {
			frameTree, err := page.GetFrameTree().Do(ctx)
			if err != nil {
				return err
			}
			return page.SetDocumentContent(frameTree.Frame.ID, html).Do(ctx)
		}),
		chromedp.ActionFunc(func(ctx context.Context) error {
			var err error
			pdfBuf, _, err = page.PrintToPDF().
				WithPrintBackground(true).
				WithMarginTop(0.8).
				WithMarginBottom(0.8).
				WithMarginLeft(0.6).
				WithMarginRight(0.6).
				WithPaperWidth(8.27).
				WithPaperHeight(11.69).
				WithDisplayHeaderFooter(true).      // ✅ เปิด header/footer
				WithHeaderTemplate(`<div></div>`).  // ✅ header ว่าง
				WithFooterTemplate(footerTemplate). // ✅ footer มี page number
				Do(ctx)
			return err
		}),
	); err != nil {
		return nil, fmt.Errorf("failed to generate PDF: %w", err)
	}

	return pdfBuf, nil
}

func buildHTML(history models.ScanHistory, result models.ScanResult) string {
	date := history.CreatedAt.Format("02 Jan 2006 15:04:05")
	scanMode := "Basic Scan"
	modeColor := "#64748b"
	if history.ScanMode == "deep" {
		scanMode = "Deep Scan"
		modeColor = "#7c3aed"
	}

	statusColor := "#16a34a"
	if history.Status != "success" {
		statusColor = "#dc2626"
	}

	total := history.FoundEndpoints + history.DNSResultsCount + history.JSEndpointsCount + history.NetworkCallsCount

	return fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, Arial, sans-serif; font-size: 12px; color: #1e293b; background: white; }

  /* ── Header ── */
  .header {
    background: linear-gradient(135deg, #1d4ed8, #2563eb);
    color: white;
    padding: 24px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .header p  { font-size: 11px; opacity: 0.8; }
  .header .date { font-size: 10px; opacity: 0.7; text-align: right; }

  /* ✅ Mini header สำหรับหน้า 2+ */
  .mini-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 2px solid #2563eb;
    margin-bottom: 16px;
    page-break-after: avoid;
  }
  .mini-header-left  { font-size: 11px; font-weight: 700; color: #2563eb; }
  .mini-header-right { font-size: 9px; color: #94a3b8; }

  /* ── Content ── */
  .content { padding: 24px 32px; }

  .section {
    margin-bottom: 24px;
    page-break-inside: avoid;
  }
  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
    padding-bottom: 6px;
    border-bottom: 2px solid #2563eb;
    margin-bottom: 12px;
    page-break-after: avoid;
  }

  /* ── Info table ── */
  .info-table { width: 100%%; border-collapse: collapse; }
  .info-table tr td { padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9; }
  .info-table tr td:first-child { font-weight: 600; color: #64748b; width: 130px; }

  /* ── Stat boxes ── */
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 10px; }
  .stat-box { border-radius: 8px; padding: 12px 14px; color: white; }
  .stat-box .num { font-size: 24px; font-weight: 700; line-height: 1; }
  .stat-box .lbl { font-size: 9px; margin-top: 4px; opacity: 0.9; }
  .stat-total { font-size: 11px; font-weight: 600; color: #2563eb; text-align: right; }

  /* ── List items ── */
  .list-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 5px 8px;
    border-radius: 5px;
    margin-bottom: 3px;
    background: #f8faff;
    border: 1px solid #e2e8f0;
    font-size: 10px;
    font-family: monospace;
    word-break: break-all;
    page-break-inside: avoid;
  }
  .list-num { color: #2563eb; font-weight: 700; min-width: 20px; font-family: Arial; }

  /* ── Badges ── */
  .badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 700;
    color: white;
    min-width: 36px;
    text-align: center;
    flex-shrink: 0;
    margin-top: 1px;
  }
  .badge-fetch { background: #2563eb; }
  .badge-xhr   { background: #7c3aed; }

  /* ── Page break helper ── */
  .page-break {
    page-break-before: always;
    padding-top: 8px;
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>Backend Discovery Tool</h1>
    <p>Scan Report &nbsp;|&nbsp; Reconnaissance Tool</p>
  </div>
  <div class="date">Generated<br>%s</div>
</div>

<div class="content">

  <!-- Scan Information -->
  <div class="section">
    <div class="section-title">Scan Information</div>
    <table class="info-table">
      <tr><td>URL</td><td>%s</td></tr>
      <tr><td>Scan Date</td><td>%s</td></tr>
      <tr><td>Scan Mode</td><td><span style="color:%s;font-weight:600">%s</span></td></tr>
      <tr><td>Duration</td><td>%s</td></tr>
      <tr><td>Status</td><td><span style="color:%s;font-weight:600">%s</span></td></tr>
      <tr><td>IP Address</td><td>%s</td></tr>
    </table>
  </div>

  <!-- Summary -->
  <div class="section">
    <div class="section-title">Summary</div>
    <div class="stat-grid">
      <div class="stat-box" style="background:#2563eb">
        <div class="num">%d</div><div class="lbl">HTML Endpoints</div>
      </div>
      <div class="stat-box" style="background:#10b981">
        <div class="num">%d</div><div class="lbl">DNS Results</div>
      </div>
      <div class="stat-box" style="background:#f59e0b">
        <div class="num">%d</div><div class="lbl">JS Endpoints</div>
      </div>
      <div class="stat-box" style="background:#8b5cf6">
        <div class="num">%d</div><div class="lbl">Network Calls</div>
      </div>
    </div>
    <div class="stat-total">Total Findings: %d items</div>
  </div>

  %s %s %s %s %s

</div>
</body>
</html>`,
		time.Now().Format("02 Jan 2006 15:04"),
		history.URL,
		date,
		modeColor, scanMode,
		history.ScanDuration,
		statusColor, strings.ToUpper(history.Status),
		history.IPAddress,
		history.FoundEndpoints,
		history.DNSResultsCount,
		history.JSEndpointsCount,
		history.NetworkCallsCount,
		total,
		buildHeadersSection(result.Headers),
		buildListSection("Found Endpoints", result.FoundEndpoints),
		buildListSection("DNS Results", result.DNSResults),
		buildListSection("JS Endpoints", result.JSEndpoints),
		buildNetworkSection(result.NetworkCalls),
	)
}

// miniHeader สร้าง mini header สำหรับหน้าที่ 2+
func miniHeader(subtitle string) string {
	return fmt.Sprintf(`
	<div class="page-break">
	  <div class="mini-header">
	    <span class="mini-header-left">Backend Discovery Tool</span>
	    <span class="mini-header-right">%s (continued)</span>
	  </div>
	</div>`, subtitle)
}

func buildHeadersSection(headers map[string]string) string {
	if len(headers) == 0 {
		return ""
	}
	rows := ""
	for k, v := range headers {
		if len(v) > 80 {
			v = v[:77] + "..."
		}
		rows += fmt.Sprintf(`<tr><td>%s</td><td>%s</td></tr>`, k, v)
	}
	return fmt.Sprintf(`
	<div class="section">
	  <div class="section-title">Response Headers (%d)</div>
	  <table class="info-table">%s</table>
	</div>`, len(headers), rows)
}

func buildListSection(title string, items []string) string {
	if len(items) == 0 {
		return ""
	}

	// ถ้า items เยอะขึ้นหน้าใหม่พร้อม mini header
	opener := fmt.Sprintf(`<div class="section"><div class="section-title">%s (%d)</div>`, title, len(items))
	if len(items) > 8 {
		opener = miniHeader(title) + fmt.Sprintf(`<div class="section"><div class="section-title">%s (%d)</div>`, title, len(items))
	}

	html := opener
	for i, item := range items {
		// ขึ้นหน้าใหม่ทุก 30 items
		if i > 0 && i%30 == 0 {
			html += miniHeader(title)
		}

		if len(item) > 75 {
			item = item[:72] + "..."
		}
		html += fmt.Sprintf(`
		<div class="list-item">
		  <span class="list-num">%d.</span>
		  <span>%s</span>
		</div>`, i+1, item)
	}
	html += `</div>`
	return html
}

func buildNetworkSection(items []string) string {
	if len(items) == 0 {
		return ""
	}

	opener := fmt.Sprintf(`<div class="section"><div class="section-title">Network Calls (%d)</div>`, len(items))
	if len(items) > 8 {
		opener = miniHeader("Network Calls") + fmt.Sprintf(`<div class="section"><div class="section-title">Network Calls (%d)</div>`, len(items))
	}

	html := opener
	for i, item := range items {
		if i > 0 && i%30 == 0 {
			html += miniHeader("Network Calls")
		}

		reqType := ""
		url := item
		badgeClass := "badge-fetch"

		if strings.HasPrefix(item, "[") {
			parts := strings.SplitN(item, "] ", 2)
			if len(parts) == 2 {
				reqType = strings.Trim(parts[0], "[]")
				url = parts[1]
				if reqType == "XMLHTTPREQUEST" {
					reqType = "XHR"
					badgeClass = "badge-xhr"
				}
			}
		}

		if len(url) > 80 {
			url = url[:77] + "..."
		}

		badge := ""
		if reqType != "" {
			badge = fmt.Sprintf(`<span class="badge %s">%s</span>`, badgeClass, reqType)
		}

		html += fmt.Sprintf(`
		<div class="list-item">
		  %s<span>%s</span>
		</div>`, badge, url)
	}
	html += `</div>`
	return html
}
