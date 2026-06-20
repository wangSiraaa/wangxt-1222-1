package handlers

import (
	"reservoir-gate-scheduling/config"
	"reservoir-gate-scheduling/models"
	"reservoir-gate-scheduling/utils"
	"time"

	"github.com/gofiber/fiber/v2"
)

type WarningHandler struct{}

func NewWarningHandler() *WarningHandler {
	return &WarningHandler{}
}

func (h *WarningHandler) List(c *fiber.Ctx) error {
	var warnings []models.WarningRecord
	query := config.DB.Order("created_at DESC")

	warningType := c.Query("warning_type")
	warningLevel := c.Query("warning_level")
	isHandled := c.Query("is_handled")

	if warningType != "" {
		query = query.Where("warning_type = ?", warningType)
	}
	if warningLevel != "" {
		query = query.Where("warning_level = ?", warningLevel)
	}
	if isHandled != "" {
		query = query.Where("is_handled = ?", isHandled == "true")
	}

	if err := query.Find(&warnings).Error; err != nil {
		return utils.InternalError(c, "Failed to query warning records")
	}

	return utils.Success(c, warnings)
}

func (h *WarningHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	var warning models.WarningRecord
	if err := config.DB.First(&warning, "id = ?", id).Error; err != nil {
		return utils.NotFound(c, "Warning record not found")
	}
	return utils.Success(c, warning)
}

func (h *WarningHandler) Handle(c *fiber.Ctx) error {
	id := c.Params("id")
	var warning models.WarningRecord
	if err := config.DB.First(&warning, "id = ?", id).Error; err != nil {
		return utils.NotFound(c, "Warning record not found")
	}

	var req struct {
		HandlerID    string `json:"handler_id"`
		HandlerName  string `json:"handler_name"`
		HandleRemark string `json:"handle_remark"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	warning.IsHandled = true
	warning.HandledAt = time.Now()
	warning.HandlerID = req.HandlerID
	warning.HandlerName = req.HandlerName
	warning.HandleRemark = req.HandleRemark

	if err := config.DB.Save(&warning).Error; err != nil {
		return utils.InternalError(c, "Failed to handle warning")
	}

	return utils.Success(c, warning)
}

func (h *WarningHandler) GetStats(c *fiber.Ctx) error {
	var total int64
	var unhandled int64
	var highCount int64
	var mediumCount int64
	var lowCount int64

	config.DB.Model(&models.WarningRecord{}).Count(&total)
	config.DB.Model(&models.WarningRecord{}).Where("is_handled = ?", false).Count(&unhandled)
	config.DB.Model(&models.WarningRecord{}).Where("warning_level = ?", "high").Count(&highCount)
	config.DB.Model(&models.WarningRecord{}).Where("warning_level = ?", "medium").Count(&mediumCount)
	config.DB.Model(&models.WarningRecord{}).Where("warning_level = ?", "low").Count(&lowCount)

	stats := map[string]interface{}{
		"total":     total,
		"unhandled": unhandled,
		"high":      highCount,
		"medium":    mediumCount,
		"low":       lowCount,
	}

	return utils.Success(c, stats)
}
