package handlers

import (
	"backend-discovery/services"

	"github.com/gofiber/fiber/v2"
)

type JobHandler struct {
	WorkerPool *services.WorkerPool
}

// GetJob handles GET /api/jobs/:id
func (h *JobHandler) GetJob(c *fiber.Ctx) error {
	jobID := c.Params("id")
	if jobID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  "error",
			"message": "job id is required",
		})
	}

	job, err := h.WorkerPool.GetJob(jobID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"status":  "error",
			"message": "job not found",
		})
	}

	return c.JSON(fiber.Map{
		"status": "success",
		"data":   job,
	})
}
