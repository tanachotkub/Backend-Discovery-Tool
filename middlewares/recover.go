package middlewares

import (
	"encoding/json"
	"log"
	"net/http"
	"runtime/debug"
)

// Recover catches panics and returns a 500 JSON response instead of crashing
func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("PANIC: %v\n%s", err, debug.Stack())

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				json.NewEncoder(w).Encode(map[string]string{
					"status":  "error",
					"message": "internal server error",
				})
			}
		}()
		next.ServeHTTP(w, r)
	})
}
