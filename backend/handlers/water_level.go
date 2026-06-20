package handlers

import (
	"reservoir-gate-scheduling/config"
	"reservoir-gate-scheduling/models"
	"reservoir-gate-scheduling/services"
	"reservoir-gate-scheduling/utils"
	"time"

	"github.com/gofiber/fiber/v2"
)

type WaterLevelHandler struct {
	service *services.SchedulingService
}

func NewWaterLevelHandler() *WaterLevelHandler {
	return &WaterLevelHandler{
		service: services.NewSchedulingService(),
	}
}

func (h *WaterLevelHandler) Create(c *fiber.Ctx) error {
	var record models.WaterLevelRecord
	if err := c.BodyParser(&record); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	if record.RecordTime.IsZero() {
		record.RecordTime = time.Now()
	}

	if err := config.DB.Create(&record).Error; err != nil {
		return utils.InternalError(c, "Failed to create water level record")
	}

	if record.DownstreamWaterLevel >= config.AppConfig.WarningWaterLevel {
		warning := h.service.GenerateWarning(
			"water_level",
			"high",
			"下游水位超过警戒水位",
			record.ID,
			"water_level",
		)
		config.DB.Create(warning)
	}

	return utils.Success(c, record)
}

func (h *WaterLevelHandler) List(c *fiber.Ctx) error {
	var records []models.WaterLevelRecord
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	query := config.DB.Order("record_time DESC")

	if startDate != "" {
		query = query.Where("record_time >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("record_time <= ?", endDate)
	}

	if err := query.Find(&records).Error; err != nil {
		return utils.InternalError(c, "Failed to query water level records")
	}

	return utils.Success(c, records)
}

func (h *WaterLevelHandler) GetLatest(c *fiber.Ctx) error {
	var record models.WaterLevelRecord
	if err := config.DB.Order("record_time DESC").First(&record).Error; err != nil {
		return utils.NotFound(c, "No water level records found")
	}
	return utils.Success(c, record)
}

func (h *WaterLevelHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	var record models.WaterLevelRecord
	if err := config.DB.First(&record, "id = ?", id).Error; err != nil {
		return utils.NotFound(c, "Water level record not found")
	}
	return utils.Success(c, record)
}

func (h *WaterLevelHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var record models.WaterLevelRecord
	if err := config.DB.First(&record, "id = ?", id).Error; err != nil {
		return utils.NotFound(c, "Water level record not found")
	}

	if err := c.BodyParser(&record); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	if err := config.DB.Save(&record).Error; err != nil {
		return utils.InternalError(c, "Failed to update water level record")
	}

	return utils.Success(c, record)
}

func (h *WaterLevelHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	result := config.DB.Delete(&models.WaterLevelRecord{}, "id = ?", id)
	if result.Error != nil {
		return utils.InternalError(c, "Failed to delete water level record")
	}
	if result.RowsAffected == 0 {
		return utils.NotFound(c, "Water level record not found")
	}
	return utils.Success(c, nil)
}
