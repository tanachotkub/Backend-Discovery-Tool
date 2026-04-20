package handlers

import (
	"backend-discovery/services"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type HistoryHandler struct {
	Service services.HistoryService
}

// GetAll handles GET /api/scans?page=1&per_page=10&status=success
func (h *HistoryHandler) GetAll(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))
	status := c.Query("status", "")

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 10
	}

	result, err := h.Service.GetAll(services.HistoryFilter{
		Page:    page,
		PerPage: perPage,
		Status:  status,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "failed to fetch history",
		})
	}

	// แก้เป็น
	return c.JSON(fiber.Map{
		"status":      "success",
		"data":        result.Data,
		"total":       result.Total,
		"page":        result.Page,
		"per_page":    result.PerPage,
		"total_pages": result.TotalPages,
	})
}

// GetByID handles GET /api/scans/:id
func (h *HistoryHandler) GetByID(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "invalid id",
		})
	}

	history, err := h.Service.GetByID(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  "error",
			"message": "history not found",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   history,
	})
}

// Delete handles DELETE /api/scans/:id
func (h *HistoryHandler) Delete(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "invalid id",
		})
	}

	if err := h.Service.DeleteByID(uint(id)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  "error",
			"message": "failed to delete",
		})
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "deleted successfully",
	})
}
