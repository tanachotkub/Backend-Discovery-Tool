# 🕵️ Backend Discovery Tool

ระบบ Reconnaissance Tool สำหรับวิเคราะห์เว็บไซต์เพื่อค้นหา API Endpoint, Backend URL และ Technology Stack โดยอัตโนมัติ

---

## ✨ Features

- 🔍 **HTML Scanning** — วิเคราะห์ HTML ด้วย Regex เพื่อหา API endpoint
- 🌐 **DNS Enumeration** — ลอง resolve subdomain เช่น `api.`, `backend.`, `gateway.`
- 📡 **Header Analysis** — วิเคราะห์ Response Headers เพื่อดู Technology Stack
- ⚡ **Deep Scan** — เปิด Chromium Headless ด้วย chromedp เพื่อดักจับ Network Calls และ JS Endpoints
- 🔄 **Async Worker Queue** — ใช้ Redis Queue + Goroutine Worker Pool รองรับ concurrent scan
- 📝 **Scan History** — บันทึกผลลัพธ์ลง PostgreSQL พร้อม Pagination
- 🛡️ **SSRF Protection** — ป้องกัน private IP, localhost, AWS metadata endpoint
- ⏱️ **Rate Limiting** — จำกัด 5 requests/minute/IP ผ่าน Redis
- 📄 **Export PDF** — Export ผลลัพธ์การสแกนเป็น PDF Report
- 🐳 **Docker Support** — รัน full stack ด้วย docker compose คำสั่งเดียว

---

## 🧱 Tech Stack

### Backend
| Technology | เหตุผลที่เลือก |
|------------|---------------|
| Go + Fiber | เร็ว, lightweight, เหมาะกับ concurrent workload |
| PostgreSQL + GORM | เก็บ scan history พร้อม soft delete |
| Redis | Rate limiting + Job queue state |
| chromedp + Chromium | Deep scan + Export PDF ทำงานได้ทั้ง local และ Docker |

### Frontend
| Technology | เหตุผลที่เลือก |
|------------|---------------|
| Next.js 14 | App Router, Server Components |
| Tailwind CSS | Utility-first, light theme |
| Axios | HTTP client พร้อม interceptor |
| TypeScript | Type safety ครบทุก layer |
| Prompt Font | รองรับภาษาไทยสวยงาม |

### DevOps
| Technology | เหตุผลที่เลือก |
|------------|---------------|
| Docker | Containerize ทุก service |
| Docker Compose | Orchestrate full stack |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend (Next.js)             │
│   หน้าสแกน │ หน้าประวัติ │ หน้ารายละเอียด      │
└─────────────────┬───────────────────────────────┘
                  │ HTTP Request
┌─────────────────▼───────────────────────────────┐
│                Backend (Go + Fiber)              │
│                                                  │
│  POST /api/scan        →  Rate Limiter (Redis)   │
│                        →  Enqueue Job            │
│  GET  /api/jobs/:id    →  Job Status             │
│  GET  /api/scans       →  Scan History           │
│  GET  /api/scans/:id/export  →  Export PDF       │
└──────────┬──────────────────┬───────────────────┘
           │                  │
┌──────────▼──────┐  ┌────────▼────────┐
│  Worker Pool    │  │   PostgreSQL    │
│  (3 goroutines) │  │  scan_histories │
│                 │  └─────────────────┘
│  Basic Scan:    │
│  ├─ Fetch HTML  │  ┌─────────────────┐
│  ├─ Regex       │  │     Redis       │
│  ├─ DNS Lookup  │  │  ├─ Job Queue   │
│  └─ Headers     │  │  └─ Rate Limit  │
│                 │  └─────────────────┘
│  Deep Scan:     │
│  ├─ Basic Scan  │  ┌─────────────────┐
│  ├─ chromedp    │  │  Chromium       │
│  ├─ Network     │  │  (Headless)     │
│  └─ JS Files    │  └─────────────────┘
└─────────────────┘
```

---

## 📁 Project Structure

```
backend-discovery/
├── backend/
│   ├── cmd/
│   │   └── main.go
│   ├── config/
│   │   └── config.go
│   ├── database/
│   │   ├── postgres.go
│   │   └── redis.go
│   ├── handlers/
│   │   ├── scan.go
│   │   ├── job.go
│   │   └── history.go        # รวม Export handler
│   ├── middlewares/
│   │   ├── cors.go
│   │   └── rate_limiter.go
│   ├── models/
│   │   ├── scan.go
│   │   ├── scan_history.go
│   │   └── job.go
│   ├── routes/
│   │   └── routes.go
│   ├── services/
│   │   ├── scanner.go
│   │   ├── browser.go
│   │   ├── history.go
│   │   ├── worker.go
│   │   └── pdf.go            # PDF generation ด้วย chromedp
│   ├── docs/
│   │   └── api.md
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── .gitignore
│   └── go.mod
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx
│   │   └── history/
│   │       ├── page.tsx
│   │       └── [id]/
│   │           └── page.tsx  # มีปุ่ม Export PDF
│   ├── components/
│   │   ├── layout/
│   │   │   └── Navbar.tsx
│   │   └── ui/
│   │       ├── ScanForm.tsx
│   │       └── JobStatus.tsx
│   ├── lib/
│   │   └── api.ts            # มี exportPDF()
│   ├── types/
│   │   └── index.ts
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.local.example
│   ├── .gitignore
│   ├── next.config.js
│   └── package.json
│
├── docker-compose.yml
├── .env.example
├── Makefile
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Go 1.22+
- Node.js 18+
- PostgreSQL
- Redis
- Docker + Docker Desktop (สำหรับ Docker mode)

---

## วิธีที่ 1 — รันแบบ Manual (Development)

```bash
# Backend
cd backend
cp .env.example .env
go mod tidy
go run cmd/main.go

# Frontend (terminal ใหม่)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

ถ้า start สำเร็จจะเห็น
```
✅ PostgreSQL Connected
✅ Database migrated
✅ Redis Connected
✅ Browser scanner ready
🔧 Starting 3 workers...
🚀 Server running on :8080
```

## วิธีที่ 2 — รันด้วย Docker

```bash
cp .env.example .env
docker compose up --build
```

### เปิดเว็บ

```
Frontend  → http://localhost:3000
Backend   → http://localhost:8080/api/health
```

---

## ⚙️ Environment Variables

### Backend `.env`

```env
PORT=8080
APP_NAME=Backend Discovery Tool
APP_ENV=development

DB_DSN=host=localhost user=postgres password=yourpassword dbname=backend_discovery port=5432 sslmode=disable

REDIS_URL=redis://localhost:6379

WORKER_COUNT=3

# false = เห็นหน้าต่าง (local dev)
# true  = headless (Docker/production)
BROWSER_HEADLESS=false
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Root `.env` (Docker)

```env
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=backend_discovery
REDIS_PASSWORD=
WORKER_COUNT=3
BROWSER_HEADLESS=true
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/scan` | สร้าง scan job |
| `GET` | `/api/jobs/:id` | เช็ค job status + result |
| `GET` | `/api/scans` | ดูประวัติทั้งหมด |
| `GET` | `/api/scans/:id` | ดูประวัติรายการนั้น |
| `DELETE` | `/api/scans/:id` | ลบประวัติ |
| `GET` | `/api/scans/:id/export` | Export PDF report |

### Query Parameters สำหรับ `GET /api/scans`

```
?page=1&per_page=10&status=success
```

### ตัวอย่าง Basic Scan

```bash
curl -X POST http://localhost:8080/api/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com", "deep_scan": false}'
```

```json
{
  "status": "accepted",
  "job_id": "abc-123",
  "message": "scan job created, use GET /api/jobs/:id to check status"
}
```

### Export PDF

```bash
curl -O -J http://localhost:8080/api/scans/1/export
# ได้ไฟล์ scan-report-1.pdf
```

---

## 📄 PDF Report มีอะไรบ้าง

```
หน้า 1
├── Header — ชื่อเครื่องมือ + วันที่ generate
├── Scan Information — URL, Date, Mode, Duration, Status, IP
├── Summary — 4 stat boxes (HTML/DNS/JS/Network)
├── Response Headers
└── Found Endpoints

หน้า 2+
├── Mini header บอกว่าเป็น continued
├── JS Endpoints
├── Network Calls (badge FETCH / XHR)
└── Footer "Page X of Y" ทุกหน้า
```

---

## 🔐 Security

| มาตรการ | รายละเอียด |
|---------|-----------|
| SSRF Protection | Block localhost, private IP, AWS metadata (169.254.x) |
| Rate Limiting | 5 requests/minute/IP ผ่าน Redis |
| Response Size Limit | จำกัด 5MB ต่อ request |
| Redirect Validation | ป้องกัน open redirect ไป internal network |
| Request Timeout | 10 วินาที ต่อ request |
| CORS | กำหนด allowed origins |
| Stealth Mode | chromedp ซ่อน automation flag |

---

## 🔍 Basic vs Deep Scan

| | Basic Scan | Deep Scan |
|--|-----------|-----------|
| วิธี | Fetch HTML ธรรมดา | เปิด Chromium จริงๆ |
| เวลา | < 1 วินาที | 10–30 วินาที |
| found_endpoints | ✅ | ✅ |
| dns_results | ✅ | ✅ |
| headers | ✅ | ✅ |
| js_endpoints | ❌ | ✅ |
| network_calls | ❌ | ✅ |
| ผ่าน bot protection | ❌ | ✅ |
| Export PDF | ✅ | ✅ |

---

## 🐳 Docker Commands

```bash
docker compose up -d          # รัน
docker compose down           # หยุด (ข้อมูลยังอยู่)
docker compose build --no-cache  # build ใหม่
docker compose logs -f        # ดู logs ทั้งหมด
docker compose logs -f backend   # ดู logs backend
docker compose ps             # ดูสถานะ
docker compose down -v        # ลบทุกอย่าง (ข้อมูลหาย!)
```

---

## 🗺️ Roadmap

- [x] **Phase 1** — Basic HTML Scan + DNS + Header Analysis
- [x] **Phase 2** — Scan History (PostgreSQL) + Rate Limiting (Redis)
- [x] **Phase 3** — Headless Browser (chromedp) + JS Scanning + Async Worker Queue
- [x] **Frontend** — Next.js Dashboard ภาษาไทย (Light theme + Prompt font)
- [x] **Docker** — Dockerfile + docker-compose ครบทุก service
- [x] **Export PDF** — PDF Report พร้อม page number และ mini header
- [ ] **Cloud Deploy** — Deploy บน Railway / VPS + Nginx
- [ ] **Authenticated Scan** — ส่ง cookies เพื่อ scan หลัง login

---

## 🎓 สิ่งที่ได้เรียนรู้

| หัวข้อ | รายละเอียด |
|--------|-----------|
| HTTP Client | Fetch HTML, Headers, Redirect handling |
| Regex | Pattern matching สำหรับ endpoint discovery |
| Security | SSRF, Rate limiting, Input validation |
| DNS | Subdomain enumeration ด้วย net.LookupHost |
| Async Worker | Redis Queue + Goroutine Worker Pool |
| Headless Browser | chromedp, stealth mode, Performance API |
| Database | GORM, PostgreSQL, Soft delete, Pagination |
| Frontend | Next.js App Router, TypeScript, Tailwind CSS |
| Docker | Multi-stage build, docker-compose orchestration |
| PDF Generation | chromedp PrintToPDF, HTML to PDF |

---

## 📄 License

MIT License — ใช้ได้อย่างอิสระ

---

> ⚠️ โปรเจคนี้สร้างขึ้นเพื่อการศึกษา การใช้งานควรเป็นไปตามกฎหมายและได้รับอนุญาตจากเจ้าของระบบเท่านั้น