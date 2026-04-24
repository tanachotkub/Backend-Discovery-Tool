package handlers

import (
	"backend-discovery/services"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type DashboardHandler struct {
	Service services.DashboardService
}

func (h *DashboardHandler) GetStats(c *fiber.Ctx) error {
	days, _ := strconv.Atoi(c.Query("days", "7"))

	if days != 7 && days != 14 && days != 30 {
		days = 7
	}

	stats, err := h.Service.GetStats(days)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "failed to fetch dashboard stats",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   stats,
	})
}
