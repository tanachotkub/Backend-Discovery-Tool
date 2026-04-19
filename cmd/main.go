package main

import (
	"backend-discovery/config"
	"backend-discovery/handlers"
	"backend-discovery/middlewares"
	"backend-discovery/routes"
	"backend-discovery/services"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/helmet/v2"
)

func main() {
	// โหลด config จาก .env
	cfg := config.Load()

	// Setup Dependency Injection
	scanSrv := services.ScannerService{}
	scanHdl := handlers.ScanHandler{Service: scanSrv}

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

	// Middlewares
	app.Use(recover.New())
	app.Use(logger.New(logger.Config{
		Format:     "[${time}] | ${status} | ${latency} | ${method} ${path}\n",
		TimeFormat: "2006-01-02 15:04:05",
		TimeZone:   "Asia/Bangkok",
	}))
	app.Use(helmet.New())

	middlewares.SetupCORS(app)

	// Routes
	routes.SetupRoutes(app, &scanHdl)

	log.Printf("🚀 Backend Discovery API running on :%s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
