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
- 📊 **Dashboard Analytics** — ภาพรวมสถิติการสแกนพร้อมกราฟ
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
| Recharts | กราฟ Dashboard สวยงาม |
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
│  Dashboard │ สแกน │ ประวัติ │ รายละเอียด        │
└─────────────────┬───────────────────────────────┘
                  │ HTTP Request
┌─────────────────▼───────────────────────────────┐
│                Backend (Go + Fiber)              │
│                                                  │
│  GET  /api/dashboard/stats   →  Analytics        │
│  POST /api/scan              →  Rate Limiter      │
│                              →  Enqueue Job       │
│  GET  /api/jobs/:id          →  Job Status        │
│  GET  /api/scans             →  Scan History      │
│  GET  /api/scans/:id/export  →  Export PDF        │
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
│   ├── cmd/main.go
│   ├── config/config.go
│   ├── database/
│   │   ├── postgres.go
│   │   └── redis.go
│   ├── handlers/
│   │   ├── scan.go
│   │   ├── job.go
│   │   ├── history.go
│   │   └── dashboard.go       # Dashboard stats handler
│   ├── middlewares/
│   │   ├── cors.go
│   │   └── rate_limiter.go
│   ├── models/
│   │   ├── scan.go
│   │   ├── scan_history.go
│   │   └── job.go
│   ├── routes/routes.go
│   ├── services/
│   │   ├── scanner.go
│   │   ├── browser.go
│   │   ├── history.go
│   │   ├── worker.go
│   │   ├── pdf.go
│   │   └── dashboard.go       # Dashboard analytics logic
│   ├── docs/api.md
│   ├── Dockerfile
│   ├── .env.example
│   └── go.mod
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Dashboard Analytics
│   │   └── history/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── components/
│   │   ├── layout/Navbar.tsx
│   │   └── ui/
│   │       ├── ScanForm.tsx
│   │       └── JobStatus.tsx
│   ├── lib/api.ts
│   ├── types/index.ts
│   ├── Dockerfile
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
| `GET` | `/api/dashboard/stats` | Dashboard analytics |
| `POST` | `/api/scan` | สร้าง scan job |
| `GET` | `/api/jobs/:id` | เช็ค job status + result |
| `GET` | `/api/scans` | ดูประวัติทั้งหมด |
| `GET` | `/api/scans/:id` | ดูประวัติรายการนั้น |
| `DELETE` | `/api/scans/:id` | ลบประวัติ |
| `GET` | `/api/scans/:id/export` | Export PDF report |

### Dashboard Stats Query Parameters

```
GET /api/dashboard/stats?days=7
GET /api/dashboard/stats?days=14
GET /api/dashboard/stats?days=30
```

---

## 📊 Dashboard Analytics

หน้า Dashboard แสดงภาพรวมระบบประกอบด้วย

```
Summary Cards
├── การสแกนทั้งหมด
├── Endpoints ที่พบ
├── Success Rate (%)
└── Deep Scans

Charts
├── กราฟแท่ง — จำนวนสแกนย้อนหลัง 7 / 14 / 30 วัน
├── Pie Chart  — Basic vs Deep Scan สัดส่วน
├── Progress   — Endpoint breakdown (HTML/DNS/JS/Network)
└── Top 5 URLs ที่ scan บ่อยที่สุด
```

---

## 📄 PDF Report

```
GET /api/scans/:id/export
```

PDF ประกอบด้วย
- Header สีน้ำเงิน + วันที่ generate
- Scan Information ครบทุก field
- Summary stat boxes 4 สี
- Found Endpoints, DNS Results, JS Endpoints, Network Calls
- Badge FETCH / XHR แยกสี
- Page X of Y ทุกหน้า

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

| | Basic | Deep |
|--|-------|------|
| วิธี | Fetch HTML | Chromium Headless |
| เวลา | < 1s | 10–30s |
| HTML Endpoints | ✅ | ✅ |
| DNS Results | ✅ | ✅ |
| Headers | ✅ | ✅ |
| JS Endpoints | ❌ | ✅ |
| Network Calls | ❌ | ✅ |
| Bot protection | ❌ | ✅ |
| Export PDF | ✅ | ✅ |

---

## 🐳 Docker Commands

```bash
docker compose up -d             # รัน
docker compose down              # หยุด
docker compose build --no-cache  # build ใหม่
docker compose logs -f           # ดู logs
docker compose logs -f backend   # ดู logs backend
docker compose ps                # ดูสถานะ
docker compose down -v           # ลบทุกอย่าง (ข้อมูลหาย!)
```

---

## 🗺️ Roadmap

- [x] **v1.0.0** — Phase 1-3 + Frontend (HTML Scan, DNS, Deep Scan, Worker Queue)
- [x] **v1.0.1** — เปลี่ยน Selenium → chromedp + Docker Support
- [x] **v1.0.2** — Export PDF Report
- [x] **v1.1.0** — Dashboard Analytics (กราฟ, สถิติ, Top URLs)
- [ ] **v1.2.0** — Cloud Deploy (Railway / VPS + Nginx)
- [ ] **v1.3.0** — Authenticated Scan (ส่ง cookies scan หลัง login)

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
| Analytics | Aggregation queries, time-series data |
| Frontend | Next.js App Router, TypeScript, Tailwind, Recharts |
| Docker | Multi-stage build, docker-compose orchestration |
| PDF Generation | chromedp PrintToPDF, HTML to PDF |

---

## 📄 License

MIT License — ใช้ได้อย่างอิสระ

---

> ⚠️ โปรเจคนี้สร้างขึ้นเพื่อการศึกษา การใช้งานควรเป็นไปตามกฎหมายและได้รับอนุญาตจากเจ้าของระบบเท่านั้น