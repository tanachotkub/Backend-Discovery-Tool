# API Documentation

## Base URL

```
http://localhost:8080
```

---

## Endpoints

### GET /api/health

ตรวจสอบสถานะ server

**Response 200**
```json
{
  "status": "ok",
  "service": "Backend Discovery Tool",
  "version": "1.0.0"
}
```

---

### POST /api/scan

สแกนเว็บไซต์เพื่อค้นหา API endpoints

**Request Body**
```json
{
  "url": "https://example.com"
}
```

**Response 200 — Success**
```json
{
  "status": "success",
  "url": "https://example.com",
  "found_endpoints": [
    "https://api.example.com/v1/users",
    "/api/auth/login",
    "/graphql"
  ],
  "headers": {
    "server": "nginx/1.18.0",
    "x-powered-by": "Express"
  },
  "dns_results": [
    "api.example.com → 93.184.216.34"
  ],
  "scan_duration": "1.45s"
}
```

**Response 400 — Error**
```json
{
  "status": "error",
  "error": "scanning localhost is not allowed"
}
```

---

## Error Cases

| Error | Cause |
|-------|-------|
| `url field is required` | ไม่ส่ง url มา |
| `URL must start with http:// or https://` | scheme ผิด |
| `scanning localhost is not allowed` | พยายาม scan localhost |
| `scanning private IP ranges is not allowed` | พยายาม scan private IP |
| `failed to fetch: ...` | ไม่สามารถ fetch URL ได้ |
