# 🕵️ Backend Discovery Tool

ระบบ Reconnaissance Tool สำหรับวิเคราะห์เว็บไซต์เพื่อค้นหา API Endpoint, Backend URL และ Technology Stack โดยอัตโนมัติ

---

## ✨ Features

- 🔍 **HTML Scanning** — วิเคราะห์ HTML ด้วย Regex เพื่อหา API endpoint
- 🌐 **DNS Enumeration** — ลอง resolve subdomain เช่น `api.`, `backend.`, `gateway.`
- 📡 **Header Analysis** — วิเคราะห์ Response Headers เพื่อดู Technology Stack
- ⚡ **Deep Scan** — เปิด Browser จริงด้วย Selenium (Edge) เพื่อดักจับ Network Calls และ JS Endpoints
- 🔄 **Async Worker Queue** — ใช้ Redis Queue + Goroutine Worker Pool รองรับ concurrent scan
- 📝 **Scan History** — บันทึกผลลัพธ์ลง PostgreSQL พร้อม Pagination
- 🛡️ **SSRF Protection** — ป้องกัน private IP, localhost, AWS metadata endpoint
- ⏱️ **Rate Limiting** — จำกัด 5 requests/minute/IP ผ่าน Redis
- 🐳 **Docker Support** — รัน full stack ด้วย docker compose คำสั่งเดียว

---

## 🧱 Tech Stack

### Backend
| Technology | เหตุผลที่เลือก |
|------------|---------------|
| Go + Fiber | เร็ว, lightweight, เหมาะกับ concurrent workload |
| PostgreSQL + GORM | เก็บ scan history พร้อม soft delete |
| Redis | Rate limiting + Job queue state |
| Selenium (Edge) | Deep scan ผ่าน bot protection ได้ดีกว่า Playwright |

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
| Docker | containerize ทุก service |
| Docker Compose | orchestrate full stack |

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
│  POST /api/scan  →  Rate Limiter (Redis)         │
│                  →  Enqueue Job                  │
│                                                  │
│  GET /api/jobs/:id  →  ดึง Job Status            │
│  GET /api/scans     →  Scan History              │
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
│  ├─ Selenium    │  │  Edge Browser   │
│  ├─ Network     │  │  (Headless)     │
│  └─ JS Files    │  └─────────────────┘
└─────────────────┘
```

---

## 📁 Project Structure

```
backend-discovery/
├── backend/                    # Go API Server
│   ├── cmd/
│   │   └── main.go             # Entry point
│   ├── config/
│   │   └── config.go           # Load .env config
│   ├── database/
│   │   ├── postgres.go         # PostgreSQL connection
│   │   └── redis.go            # Redis connection
│   ├── handlers/
│   │   ├── scan.go             # POST /api/scan
│   │   ├── job.go              # GET /api/jobs/:id
│   │   └── history.go          # GET/DELETE /api/scans
│   ├── middlewares/
│   │   ├── cors.go             # CORS
│   │   └── rate_limiter.go     # Redis rate limiting
│   ├── models/
│   │   ├── scan.go             # Request/Response structs
│   │   ├── scan_history.go     # GORM model
│   │   └── job.go              # Job struct
│   ├── routes/
│   │   └── routes.go           # Route registration
│   ├── services/
│   │   ├── scanner.go          # Core scan logic
│   │   ├── browser.go          # Selenium deep scan
│   │   ├── history.go          # History service
│   │   └── worker.go           # Redis job queue + worker pool
│   ├── docs/
│   │   └── api.md              # API documentation
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── .gitignore
│   └── go.mod
│
├── frontend/                   # Next.js App
│   ├── app/
│   │   ├── layout.tsx           # Root layout + Prompt font
│   │   ├── globals.css          # Light theme styles
│   │   ├── page.tsx             # หน้าสแกนหลัก
│   │   └── history/
│   │       ├── page.tsx         # หน้าประวัติ + pagination
│   │       └── [id]/
│   │           └── page.tsx     # หน้ารายละเอียด
│   ├── components/
│   │   ├── layout/
│   │   │   └── Navbar.tsx
│   │   └── ui/
│   │       ├── ScanForm.tsx     # Form + Basic/Deep toggle
│   │       └── JobStatus.tsx    # Poll job + แสดงผล collapsible
│   ├── lib/
│   │   └── api.ts               # Axios API wrapper
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.local.example
│   ├── .gitignore
│   ├── next.config.js
│   └── package.json
│
├── docker-compose.yml          # Full stack orchestration
├── .env.example                # Environment variables template
├── Makefile                    # Shortcut commands
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Go 1.22+
- Node.js 18+
- PostgreSQL
- Redis
- Microsoft Edge + EdgeDriver
- Docker + Docker Desktop (สำหรับ Docker mode)

---

## วิธีที่ 1 — รันแบบ Manual (Development)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/backend-discovery.git
cd backend-discovery
```

### 2. Setup Backend

```bash
cd backend
cp .env.example .env
# แก้ไข .env ตามเครื่องของคุณ

go mod tidy
go run cmd/main.go
```

ถ้า start สำเร็จจะเห็น
```
✅ PostgreSQL Connected
✅ Database migrated
✅ Redis Connected
✅ EdgeDriver ready
🔧 Starting 3 workers...
🚀 Server running on :8080
```

### 3. Setup Frontend

```bash
cd frontend
cp .env.local.example .env.local
# แก้ไข NEXT_PUBLIC_API_URL

npm install
npm run dev
```

### 4. เปิดเว็บ

```
Frontend → http://localhost:3000
Backend  → http://localhost:8080/api/health
```

---

## วิธีที่ 2 — รันด้วย Docker (แนะนำสำหรับ Demo)

### 1. Setup

```bash
# อยู่ที่ root folder
cp .env.example .env
# แก้ไข password ใน .env
```

### 2. Build และรัน

```bash
docker compose up --build
```

### 3. รันครั้งต่อไป

```bash
docker compose up -d
```

### 4. หยุดการทำงาน

```bash
docker compose down
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

# PostgreSQL
DB_DSN=host=localhost user=postgres password=yourpassword dbname=backend_discovery port=5432 sslmode=disable

# Redis
REDIS_URL=redis://localhost:6379

# Worker
WORKER_COUNT=3

# Selenium Edge
EDGE_DRIVER_PATH=C:\WebDriver\msedgedriver.exe
EDGE_DRIVER_PORT=9515
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Root `.env` (สำหรับ Docker)

```env
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=backend_discovery
REDIS_PASSWORD=
WORKER_COUNT=3
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

### ตัวอย่าง Deep Scan

```bash
curl -X POST http://localhost:8080/api/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com", "deep_scan": true}'
```

### ตัวอย่าง Result

```json
{
  "status": "success",
  "url": "https://github.com",
  "found_endpoints": [
    "https://api.githubcopilot.com",
    "https://api.github.com/_private/browser/stats"
  ],
  "headers": {
    "server": "github.com"
  },
  "dns_results": [
    "api.github.com → 20.205.243.168"
  ],
  "js_endpoints": ["..."],
  "network_calls": ["..."],
  "scan_duration": "0.90s",
  "scan_mode": "deep"
}
```

---

## 🔐 Security

| มาตรการ | รายละเอียด |
|---------|-----------|
| SSRF Protection | Block localhost, 127.0.0.1, private IP (10.x, 172.16.x, 192.168.x), AWS metadata (169.254.x) |
| Rate Limiting | 5 requests/minute/IP ผ่าน Redis |
| Response Size Limit | จำกัด 5MB ต่อ request |
| Redirect Validation | ป้องกัน open redirect ไป internal network |
| Request Timeout | 10 วินาที ต่อ request |
| CORS | กำหนด allowed origins |
| Stealth Mode | Selenium ซ่อน automation flag ผ่าน bot protection |

---

## 🐳 Docker Commands

```bash
# รัน full stack
docker compose up -d

# หยุด (ข้อมูลยังอยู่)
docker compose down

# Build ใหม่ทั้งหมด
docker compose build --no-cache

# ดู logs
docker compose logs -f

# ดู logs เฉพาะ service
docker compose logs -f backend
docker compose logs -f frontend

# ดูสถานะ
docker compose ps

# ลบทุกอย่างรวม volume (ข้อมูลหาย!)
docker compose down -v
```

---

## 🗺️ Roadmap

- [x] **Phase 1** — Basic HTML Scan + DNS + Header Analysis
- [x] **Phase 2** — Scan History (PostgreSQL) + Rate Limiting (Redis)
- [x] **Phase 3** — Headless Browser (Selenium) + JS Scanning + Async Worker Queue
- [x] **Frontend** — Next.js Dashboard ภาษาไทย (Light theme + Prompt font)
- [x] **Docker** — Dockerfile + docker-compose ครบทุก service
- [ ] **Cloud Deploy** — Deploy บน Railway / VPS + Nginx
- [ ] **Authenticated Scan** — ส่ง cookies เพื่อ scan หลัง login
- [ ] **Export Report** — Export ผลลัพธ์เป็น PDF

---

## 🎓 สิ่งที่ได้เรียนรู้จากโปรเจคนี้

| หัวข้อ | รายละเอียด |
|--------|-----------|
| HTTP Client | Fetch HTML, Headers, Redirect handling |
| Regex | Pattern matching สำหรับ endpoint discovery |
| Security | SSRF, Rate limiting, Input validation |
| DNS | Subdomain enumeration ด้วย net.LookupHost |
| Async Worker | Redis Queue + Goroutine Worker Pool |
| Headless Browser | Selenium stealth mode, Performance API |
| Database | GORM, PostgreSQL, Soft delete, Pagination |
| Frontend | Next.js App Router, TypeScript, Tailwind CSS |
| Docker | Multi-stage build, docker-compose orchestration |

---

## 📄 License

MIT License — ใช้ได้อย่างอิสระ

---

> ⚠️ โปรเจคนี้สร้างขึ้นเพื่อการศึกษา การใช้งานควรเป็นไปตามกฎหมายและได้รับอนุญาตจากเจ้าของระบบเท่านั้น