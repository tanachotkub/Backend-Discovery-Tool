# 🕵️ Backend Discovery Tool

> Mini Project: วิเคราะห์เว็บไซต์เพื่อค้นหา Backend URL / API Endpoint
> พัฒนาแบบเป็นขั้นตอน ตั้งแต่ Basic → Advanced → Cloud Production

---

# 📌 Project Overview

โปรเจคนี้คือระบบที่ให้ผู้ใช้กรอก URL เว็บไซต์ จากนั้นระบบจะทำการวิเคราะห์หน้าเว็บเพื่อค้นหา:

* API endpoints
* Backend base URL
* Subdomains ที่เกี่ยวข้องกับ backend
* Technology stack (ในระดับ Advanced)

---

# 🧱 Tech Stack

## Frontend

* Next.js
* Tailwind CSS
* Axios

## Backend

* Go (Fiber)
* net/http
* regexp
* net/url
* net

## Database (Phase 2+)

* MySQL หรือ PostgreSQL

## Advanced Tools

* Headless Browser (Playwright หรือ Puppeteer)
* Docker
* Redis (optional)

---

# 🚀 PHASE 1 — BASIC VERSION (MVP)

## 🎯 Goal

รับ URL → Fetch HTML → ค้นหา API pattern → แสดงผลลัพธ์

---

## Step 1: Setup Project Structure

```
backend/
  main.go
  routes/
  handlers/
  services/
frontend/
  app/
  components/
```

---

## Step 2: Create Scan Endpoint (Backend)

### Route

```
POST /scan
```

### Request Body

```json
{
  "url": "https://example.com"
}
```

---

## Step 3: Validate URL (สำคัญมาก)

### ตรวจสอบ:

* ต้องขึ้นต้นด้วย http หรือ https
* ห้ามเป็น localhost
* ห้ามเป็น 127.0.0.1
* ห้ามเป็น private IP (192.168.x.x)

ป้องกัน SSRF

---

## Step 4: Fetch HTML

ใช้ http.Client พร้อม Timeout

แนวคิด:

1. สร้าง client
2. ส่ง GET request
3. อ่าน response body
4. แปลงเป็น string

---

## Step 5: Scan ด้วย Regex

ค้นหา pattern ต่อไปนี้:

* "/api"
* "[https://api](https://api)."
* "[http://api](http://api)."
* "graphql"

Regex สำหรับดึง URL ทั้งหมด:

```
https?:\/\/[^\s"']+
```

จากนั้น filter เฉพาะที่มีคำว่า api

---

## Step 6: ส่ง Response กลับ

```json
{
  "status": "success",
  "found_endpoints": [
    "https://api.example.com/v1/users",
    "/api/login"
  ]
}
```

---

## Step 7: Frontend UI

หน้าเว็บควรมี:

* Input URL
* ปุ่ม Scan
* Loading state
* แสดงผลลัพธ์เป็น list

---

# 🎯 PHASE 2 — INTERMEDIATE

## เพิ่มความสามารถดังนี้

### 1️⃣ DNS Lookup

ใช้ net.LookupHost เพื่อตรวจสอบ:

* api.domain.com
* backend.domain.com

ถ้า resolve ได้ → เพิ่มเข้า result

---

### 2️⃣ HTTP Header Analysis

ตรวจสอบ header เช่น:

* server
* x-powered-by
* via

เพื่อวิเคราะห์ technology

---

### 3️⃣ Save Scan History

สร้างตาราง:

```
scans
- id
- url
- result_json
- created_at
```

เมื่อ scan เสร็จให้บันทึกผลลง DB

---

### 4️⃣ Add Scan History Page

Frontend แสดง:

* URL
* เวลา scan
* จำนวน endpoint ที่พบ

---

# 🚀 PHASE 3 — ADVANCED

## 🎯 เป้าหมาย

วิเคราะห์ JavaScript file และ dynamic request

---

## 1️⃣ Headless Browser

ใช้ Playwright หรือ Puppeteer เพื่อ:

* เปิดเว็บจริง
* ดักจับ network requests
* บันทึก XHR / Fetch calls

ขั้นตอน:

1. Launch browser
2. เปิด URL
3. Listen network event
4. เก็บ request ที่มีคำว่า api

---

## 2️⃣ Scan External JS Files

จาก HTML:

* หา <script src="...">
* ดาวน์โหลด JS file
* ค้นหา endpoint ในไฟล์

---

## 3️⃣ Worker Queue System

ไม่ให้ request บล็อกนาน

Flow:

User → สร้าง job → เก็บใน queue → Worker ประมวลผล → Update status

สามารถใช้:

* Redis
* Goroutine worker pool

---

## 4️⃣ Rate Limiting

จำกัด:

* 5 scans / minute / IP

---

## 5️⃣ Authentication

เพิ่ม:

* JWT login
* จำกัดสิทธิ์ user

---

# ☁️ PHASE 4 — CLOUD DEPLOYMENT

## 1️⃣ Dockerize

สร้าง Dockerfile:

* build Go app
* expose port

---

## 2️⃣ Docker Compose

ประกอบด้วย:

* backend
* database
* redis

---

## 3️⃣ Deploy บน Cloud VM

ขั้นตอน:

1. สร้าง VM
2. ติดตั้ง Docker
3. clone repo
4. docker compose up -d

---

## 4️⃣ Add Reverse Proxy

ใช้ Nginx:

* HTTPS
* Domain
* Rate limit

---

## 5️⃣ Monitoring

เพิ่ม:

* log file
* uptime check
* auto restart container

---

# 🔐 Security Checklist

* Validate URL
* Block private IP
* Timeout request
* Limit response size
* Rate limit
* Log error
* Disable redirect to internal network

---

# 🗺 Development Timeline (แนะนำ)

## Week 1

* Setup project
* Basic scan
* Frontend UI

## Week 2

* DNS lookup
* Save history
* Header analysis

## Week 3

* JS scanning
* Headless browser

## Week 4

* Docker
* Deploy cloud
* Add security layer

---

# 🎓 สิ่งที่คุณจะได้เรียนรู้

* HTTP client
* Regex parsing
* Security (SSRF)
* DNS
* Async worker
* Cloud deployment
* DevOps workflow

---

# 🏁 Final Goal

ระบบที่สามารถ:

* วิเคราะห์เว็บได้จริง
* มี Dashboard
* มี Scan History
* Deploy บน Cloud
* มี Security Layer

และสามารถอธิบาย Architecture ได้ตอนสัมภาษณ์งาน

---

# 💡 Optional Upgrade Ideas

* Export report PDF
* Graph visualization
* Detect framework (Next.js, React, Vue)
* Scan technology stack
* Multi-user system

---

# 📌 Summary

เริ่มจาก Basic → เพิ่ม DNS → เพิ่ม JS scan → เพิ่ม Worker → Deploy Cloud

ทำทีละขั้น ไม่ต้องรีบ

ถ้าทำครบ จะเป็นโปรเจคระดับ Production ที่โชว์ทั้ง Backend, Security และ Cloud ได้ครบ

---

END OF DOCUMENT
