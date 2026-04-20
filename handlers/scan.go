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

func (h *ScanHandler) Health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":  "ok",
		"service": "Backend Discovery Tool",
		"version": "1.0.0",
	})
}

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

	if !strings.HasPrefix(req.URL, "http://") && !strings.HasPrefix(req.URL, "https://") {
		req.URL = "https://" + req.URL
	}

	// ส่ง IP เพื่อบันทึก history
	result := h.Service.Scan(req.URL, c.IP())

	statusCode := fiber.StatusOK
	if result.Status == "error" {
		statusCode = fiber.StatusBadRequest
	}

	return c.Status(statusCode).JSON(result)
}
