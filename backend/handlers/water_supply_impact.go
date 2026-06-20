package handlers

import (
	"reservoir-gate-scheduling/config"
	"reservoir-gate-scheduling/models"
	"reservoir-gate-scheduling/services"
	"reservoir-gate-scheduling/utils"
	"time"

	"github.com/gofiber/fiber/v2"
)

type WaterSupplyImpactHandler struct {
	service *services.SchedulingService
}

func NewWaterSupplyImpactHandler() *WaterSupplyImpactHandler {
	return &WaterSupplyImpactHandler{
		service: services.NewSchedulingService(),
	}
}

func (h *WaterSupplyImpactHandler) Create(c *fiber.Ctx) error {
	var impact models.WaterSupplyImpact
	if err := c.BodyParser(&impact); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	if err := config.DB.Create(&impact).Error; err != nil {
		return utils.InternalError(c, "Failed to create water supply impact")
	}

	return utils.Success(c, impact)
}

func (h *WaterSupplyImpactHandler) List(c *fiber.Ctx) error {
	var impacts []models.WaterSupplyImpact
	query := config.DB.Order("created_at DESC")

	scheduleID := c.Query("schedule_id")
	unit := c.Query("water_supply_unit")

	if scheduleID != "" {
		query = query.Where("schedule_id = ?", scheduleID)
	}
	if unit != "" {
		query = query.Where("water_supply_unit = ?", unit)
	}

	if err := query.Find(&impacts).Error; err != nil {
		return utils.InternalError(c, "Failed to query water supply impacts")
	}

	return utils.Success(c, impacts)
}

func (h *WaterSupplyImpactHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	var impact models.WaterSupplyImpact
	if err := config.DB.First(&impact, "id = ?", id).Error; err != nil {
		return utils.NotFound(c, "Water supply impact not found")
	}
	return utils.Success(c, impact)
}

func (h *WaterSupplyImpactHandler) MarkViewed(c *fiber.Ctx) error {
	id := c.Params("id")
	var impact models.WaterSupplyImpact
	if err := config.DB.First(&impact, "id = ?", id).Error; err != nil {
		return utils.NotFound(c, "Water supply impact not found")
	}

	var req struct {
		ViewerID   string `json:"viewer_id"`
		ViewerName string `json:"viewer_name"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	impact.ViewedAt = time.Now()
	impact.ViewerID = req.ViewerID
	impact.ViewerName = req.ViewerName

	if err := config.DB.Save(&impact).Error; err != nil {
		return utils.InternalError(c, "Failed to mark as viewed")
	}

	return utils.Success(c, impact)
}

func (h *WaterSupplyImpactHandler) GenerateImpact(c *fiber.Ctx) error {
	scheduleID := c.Params("schedule_id")
	var schedule models.GateSchedule
	if err := config.DB.First(&schedule, "id = ?", scheduleID).Error; err != nil {
		return utils.NotFound(c, "Gate schedule not found")
	}

	var req struct {
		WaterSupplyUnit string `json:"water_supply_unit"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	impact := h.service.CalculateWaterImpact(&schedule, req.WaterSupplyUnit)

	if err := config.DB.Create(impact).Error; err != nil {
		return utils.InternalError(c, "Failed to generate water supply impact")
	}

	return utils.Success(c, impact)
}
