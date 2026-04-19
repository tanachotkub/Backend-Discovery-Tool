package routes

import (
	"backend-discovery/handlers"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App, scanHdl *handlers.ScanHandler) {
	api := app.Group("/api")

	api.Get("/health", scanHdl.Health)
	api.Post("/scan", scanHdl.Scan)
}
