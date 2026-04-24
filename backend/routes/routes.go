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
	jobHdl *handlers.JobHandler,
	dashHdl *handlers.DashboardHandler, // ← เพิ่ม
) {
	api := app.Group("/api")

	api.Get("/health", scanHdl.Health)
	api.Get("/dashboard/stats", dashHdl.GetStats) // ← เพิ่ม

	if database.RedisClient != nil {
		api.Post("/scan", middlewares.RateLimiter(database.RedisClient), scanHdl.Scan)
	} else {
		api.Post("/scan", scanHdl.Scan)
	}

	api.Get("/jobs/:id", jobHdl.GetJob)

	scans := api.Group("/scans")
	scans.Get("/", historyHdl.GetAll)
	scans.Get("/:id", historyHdl.GetByID)
	scans.Delete("/:id", historyHdl.Delete)
	scans.Get("/:id/export", historyHdl.Export)

}
