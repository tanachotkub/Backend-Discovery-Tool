package routes

import (
	"backend-discovery/handlers"
	"backend-discovery/middlewares"
	"net/http"
)

// Setup registers all routes and wraps with middleware stack
// Middleware order (outer → inner): Recover → Logger → CORS → Handler
func Setup() http.Handler {
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/health", handlers.HealthHandler)
	mux.HandleFunc("/api/scan", handlers.ScanHandler)

	// 404 fallback
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		w.Write([]byte(`{"status":"error","message":"route not found"}`))
	})

	// Apply middleware chain
	return middlewares.Recover(
		middlewares.Logger(
			middlewares.CORS(mux),
		),
	)
}
