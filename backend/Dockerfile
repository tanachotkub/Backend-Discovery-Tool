# ── Stage 1: Build ──────────────────────────────────────────
FROM golang:1.22-alpine AS builder

# ติดตั้ง dependencies ที่จำเป็น
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /app

# Copy go.mod และ go.sum ก่อน (cache layer)
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -o backend ./cmd/main.go

# ── Stage 2: Run ─────────────────────────────────────────────
# Stage 2: Run
FROM alpine:3.19

# เพิ่ม chromium
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    curl \
    chromium \
    chromium-chromedriver \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont

ENV TZ=Asia/Bangkok
ENV CHROME_BIN=/usr/bin/chromium-browser
ENV CHROME_PATH=/usr/lib/chromium/

WORKDIR /app
COPY --from=builder /app/backend .

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
    CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["./backend"]