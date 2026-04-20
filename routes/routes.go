package routes

import (
	"backend-discovery/database"
	"backend-discovery/handlers"
	"backend-discovery/middlewares"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(
	app *fiber.App,
	scanHdl *handlers.ScanHandler,
	historyHdl *handlers.HistoryHandler,
) {
	api := app.Group("/api")

	api.Get("/health", scanHdl.Health)

	// Rate limit เฉพาะ /scan
	if database.RedisClient != nil {
		api.Post("/scan", middlewares.RateLimiter(database.RedisClient), scanHdl.Scan)
	} else {
		api.Post("/scan", scanHdl.Scan)
	}

	// History routes
	scans := api.Group("/scans")
	scans.Get("/", historyHdl.GetAll)
	scans.Get("/:id", historyHdl.GetByID)
	scans.Delete("/:id", historyHdl.Delete)
}
