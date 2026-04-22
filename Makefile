# Backend Discovery Tool — Docker Commands

.PHONY: help up down build logs ps clean

help: ## แสดง commands ทั้งหมด
	@echo ""
	@echo "Backend Discovery Tool"
	@echo "======================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

up: ## รัน services ทั้งหมด
	docker compose up -d

down: ## หยุด services ทั้งหมด
	docker compose down

build: ## Build images ใหม่
	docker compose build --no-cache

logs: ## ดู logs ทั้งหมด
	docker compose logs -f

logs-backend: ## ดู logs เฉพาะ backend
	docker compose logs -f backend

logs-frontend: ## ดู logs เฉพาะ frontend
	docker compose logs -f frontend

ps: ## ดูสถานะ services
	docker compose ps

restart: ## Restart services ทั้งหมด
	docker compose restart

clean: ## ลบ containers + volumes (ข้อมูลหาย!)
	docker compose down -v --remove-orphans

setup: ## Setup ครั้งแรก
	cp .env.example .env
	@echo "✅ สร้าง .env แล้ว กรุณาแก้ไข password ก่อนรัน make up"
