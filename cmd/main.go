package main

import (
	"backend-discovery/config"
	"backend-discovery/database"
	"backend-discovery/handlers"
	"backend-discovery/middlewares"
	"backend-discovery/models"
	"backend-discovery/routes"
	"backend-discovery/services"
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/helmet/v2"
)

func main() {
	cfg := config.Load()

	// Connect PostgreSQL
	db, err := database.ConnectPostgres(cfg.DBDsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("✅ PostgreSQL Connected")

	// Migrate
	if err := models.MigrateDB(db); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}
	log.Println("✅ Database migrated")

	// Connect Redis
	if err := database.ConnectRedis(cfg.RedisURL); err != nil {
		log.Fatalf("Redis required for Phase 3: %v", err)
	}
	log.Println("✅ Redis Connected")

	// เพิ่มหลัง Redis connect
	log.Println("⏳ Installing Playwright browsers...")
	if err := services.InstallBrowser(); err != nil {
		log.Printf("⚠️  Playwright install warning: %v", err)
	} else {
		log.Println("✅ Playwright ready")
	}

	// Worker Pool
	workerPool := services.NewWorkerPool(db, database.RedisClient, cfg.WorkerCount)

	// Start workers พร้อม graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	workerPool.Start(ctx)

	// Dependency Injection
	scanHdl := &handlers.ScanHandler{WorkerPool: workerPool}
	jobHdl := &handlers.JobHandler{WorkerPool: workerPool}
	historyHdl := &handlers.HistoryHandler{
		Service: services.HistoryService{DB: db},
	}

	// Setup Fiber
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"status":  "error",
				"message": err.Error(),
			})
		},
	})

	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format:     "[${time}] | ${status} | ${latency} | ${method} ${path}\n",
		TimeFormat: "2006-01-02 15:04:05",
		TimeZone:   "Asia/Bangkok",
	}))
	app.Use(helmet.New())
	middlewares.SetupCORS(app)

	routes.SetupRoutes(app, scanHdl, historyHdl, jobHdl)

	// Graceful shutdown
	go func() {
		sig := make(chan os.Signal, 1)
		signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
		<-sig
		log.Println("🛑 Shutting down...")
		cancel() // หยุด workers
		app.Shutdown()
	}()

	log.Printf("🚀 Server running on :%s (workers: %d)", cfg.Port, cfg.WorkerCount)
	log.Fatal(app.Listen(":" + cfg.Port))
}
