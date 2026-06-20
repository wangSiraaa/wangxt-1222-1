package handlers

import (
	"fmt"
	"reservoir-gate-scheduling/config"
	"reservoir-gate-scheduling/models"
	"reservoir-gate-scheduling/services"
	"reservoir-gate-scheduling/utils"
	"time"

	"github.com/gofiber/fiber/v2"
)

type GateActualOpeningHandler struct {
	service *services.SchedulingService
}

func NewGateActualOpeningHandler() *GateActualOpeningHandler {
	return &GateActualOpeningHandler{
		service: services.NewSchedulingService(),
	}
}

func (h *GateActualOpeningHandler) Create(c *fiber.Ctx) error {
	var actual models.GateActualOpening
	if err := c.BodyParser(&actual); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	if actual.RecordTime.IsZero() {
		actual.RecordTime = time.Now()
	}

	var plannedOpening float64
	if actual.ScheduleID != "" {
		var schedule models.GateSchedule
		if err := config.DB.First(&schedule, "id = ?", actual.ScheduleID).Error; err == nil {
			plannedOpening = schedule.PlannedOpening
		}
	}

	deviation, exceeded := h.service.CheckGateDeviation(&actual, plannedOpening)
	if exceeded && actual.DeviationReason == "" {
		return utils.BadRequest(c, "闸门实际开度与计划偏差过大（"+formatFloat(deviation)+"%），请填写偏差原因")
	}

	if err := config.DB.Create(&actual).Error; err != nil {
		return utils.InternalError(c, "Failed to create actual opening record")
	}

	if exceeded {
		warning := h.service.GenerateWarning(
			"gate_deviation",
			"medium",
			"闸门实际开度与计划偏差过大，偏差值："+formatFloat(deviation)+"%",
			actual.ID,
			"gate_actual_opening",
		)
		config.DB.Create(warning)
	}

	return utils.Success(c, actual)
}

func (h *GateActualOpeningHandler) List(c *fiber.Ctx) error {
	var records []models.GateActualOpening
	query := config.DB.Order("record_time DESC")

	scheduleID := c.Query("schedule_id")
	gateNo := c.Query("gate_no")
	onlyDeviation := c.Query("only_deviation")

	if scheduleID != "" {
		query = query.Where("schedule_id = ?", scheduleID)
	}
	if gateNo != "" {
		query = query.Where("gate_no = ?", gateNo)
	}
	if onlyDeviation == "true" {
		query = query.Where("is_deviation_exceeded = ?", true)
	}

	if err := query.Find(&records).Error; err != nil {
		return utils.InternalError(c, "Failed to query actual opening records")
	}

	return utils.Success(c, records)
}

func (h *GateActualOpeningHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	var record models.GateActualOpening
	if err := config.DB.First(&record, "id = ?", id).Error; err != nil {
		return utils.NotFound(c, "Actual opening record not found")
	}
	return utils.Success(c, record)
}

func (h *GateActualOpeningHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var record models.GateActualOpening
	if err := config.DB.First(&record, "id = ?", id).Error; err != nil {
		return utils.NotFound(c, "Actual opening record not found")
	}

	if err := c.BodyParser(&record); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	if err := config.DB.Save(&record).Error; err != nil {
		return utils.InternalError(c, "Failed to update actual opening record")
	}

	return utils.Success(c, record)
}

func formatFloat(f float64) string {
	return fmt.Sprintf("%.2f", f)
}
