package handlers

import (
	"backend-discovery/models"
	"backend-discovery/services"
	"encoding/json"
	"net/http"
	"strings"
)

// writeJSON is a helper to send JSON responses
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

// ScanHandler handles POST /api/scan
func ScanHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, models.ErrorResponse{
			Status:  "error",
			Message: "method not allowed, use POST",
		})
		return
	}

	var req models.ScanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.ErrorResponse{
			Status:  "error",
			Message: "invalid JSON body",
		})
		return
	}

	req.URL = strings.TrimSpace(req.URL)
	if req.URL == "" {
		writeJSON(w, http.StatusBadRequest, models.ErrorResponse{
			Status:  "error",
			Message: "url field is required",
		})
		return
	}

	// Auto-add https:// if missing
	if !strings.HasPrefix(req.URL, "http://") && !strings.HasPrefix(req.URL, "https://") {
		req.URL = "https://" + req.URL
	}

	result := services.Scan(req.URL)

	statusCode := http.StatusOK
	if result.Status == "error" {
		statusCode = http.StatusBadRequest
	}

	writeJSON(w, statusCode, result)
}

// HealthHandler handles GET /api/health
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "Backend Discovery Tool",
		"version": "1.0.0",
	})
}
