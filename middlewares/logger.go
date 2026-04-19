package middlewares

import (
	"log"
	"net/http"
	"time"
)

// Logger logs each incoming request with method, path, and duration
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Wrap ResponseWriter to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		next.ServeHTTP(wrapped, r)

		log.Printf("[%s] %d %s %s — %s",
			time.Now().Format("2006-01-02 15:04:05"),
			wrapped.statusCode,
			r.Method,
			r.URL.Path,
			time.Since(start),
		)
	})
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
