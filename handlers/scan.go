package handlers

import (
	"backend-discovery/models"
	"backend-discovery/services"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type ScanHandler struct {
	Service services.ScannerService
}

// Health handles GET /api/health
func (h *ScanHandler) Health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":  "ok",
		"service": "Backend Discovery Tool",
		"version": "1.0.0",
	})
}

// Scan handles POST /api/scan
func (h *ScanHandler) Scan(c *fiber.Ctx) error {
	var req models.ScanRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "invalid JSON body",
		})
	}

	req.URL = strings.TrimSpace(req.URL)
	if req.URL == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "url field is required",
		})
	}

	// Auto-add https:// ถ้าไม่มี scheme
	if !strings.HasPrefix(req.URL, "http://") && !strings.HasPrefix(req.URL, "https://") {
		req.URL = "https://" + req.URL
	}

	result := h.Service.Scan(req.URL)

	statusCode := fiber.StatusOK
	if result.Status == "error" {
		statusCode = fiber.StatusBadRequest
	}

	return c.Status(statusCode).JSON(result)
}
