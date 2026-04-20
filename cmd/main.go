package main

import (
	"backend-discovery/config"
	"backend-discovery/database"
	"backend-discovery/handlers"
	"backend-discovery/middlewares"
	"backend-discovery/models"
	"backend-discovery/routes"
	"backend-discovery/services"
	"log"

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
		log.Printf("⚠️  Redis warning: %v (rate limiting disabled)", err)
	} else {
		log.Println("✅ Redis Connected")
	}

	// Dependency Injection
	scanSrv := services.ScannerService{DB: db}
	historySrv := services.HistoryService{DB: db}

	scanHdl := handlers.ScanHandler{Service: scanSrv}
	historyHdl := handlers.HistoryHandler{Service: historySrv}

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

	routes.SetupRoutes(app, &scanHdl, &historyHdl)

	log.Printf("🚀 Server running on :%s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
