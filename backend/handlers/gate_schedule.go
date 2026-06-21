package handlers

import (
	"reservoir-gate-scheduling/config"
	"reservoir-gate-scheduling/models"
	"reservoir-gate-scheduling/services"
	"reservoir-gate-scheduling/utils"
	"time"

	"github.com/gofiber/fiber/v2"
)

type GateScheduleHandler struct {
	service *services.SchedulingService
}

func NewGateScheduleHandler() *GateScheduleHandler {
	return &GateScheduleHandler{
		service: services.NewSchedulingService(),
	}
}

func (h *GateScheduleHandler) Create(c *fiber.Ctx) error {
	var schedule models.GateSchedule
	if err := c.BodyParser(&schedule); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	if schedule.ScheduleDate.IsZero() {
		schedule.ScheduleDate = time.Now()
	}
	if schedule.Status == "" {
		schedule.Status = "draft"
	}

	var latestWaterLevel models.WaterLevelRecord
	config.DB.Order("record_time DESC").First(&latestWaterLevel)

	if err := h.service.ValidateGateSchedule(&schedule, &latestWaterLevel); err != nil {
		return utils.BadRequest(c, err.Error())
	}

	if err := config.DB.Create(&schedule).Error; err != nil {
		return utils.InternalError(c, "Failed to create gate schedule")
	}

	return utils.Success(c, schedule)
}

func (h *GateScheduleHandler) List(c *fiber.Ctx) error {
	var schedules []models.GateSchedule
	query := config.DB.Order("schedule_date DESC")

	status := c.Query("status")
	gateNo := c.Query("gate_no")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if gateNo != "" {
		query = query.Where("gate_no = ?", gateNo)
	}
	if startDate != "" {
		query = query.Where("schedule_date >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("schedule_date <= ?", endDate)
	}

	if err := query.Find(&schedules).Error; err != nil {
		return utils.InternalError(c, "Failed to query gate schedules")
	}

	return utils.Success(c, schedules)
}

func (h *GateScheduleHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	var schedule models.GateSchedule
	if err := config.DB.First(&schedule, "id = ?", id).Error; err != nil {
		return utils.NotFound(c, "Gate schedule not found")
	}
	return utils.Success(c, schedule)
}

func (h *GateScheduleHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var schedule models.GateSchedule
	if err := config.DB.First(&schedule, "id = ?", id).Error; err != nil {
		return utils.NotFound(c, "Gate schedule not found")
	}

	var latestWaterLevel models.WaterLevelRecord
	config.DB.Order("record_time DESC").First(&latestWaterLevel)

	if err := c.BodyParser(&schedule); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	if err := h.service.ValidateGateSchedule(&schedule, &latestWaterLevel); err != nil {
		return utils.BadRequest(c, err.Error())
	}

	if err := config.DB.Save(&schedule).Error; err != nil {
		return utils.InternalError(c, "Failed to update gate schedule")
	}

	return utils.Success(c, schedule)
}

func (h *GateScheduleHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	result := config.DB.Delete(&models.GateSchedule{}, "id = ?", id)
	if result.Error != nil {
		return utils.InternalError(c, "Failed to delete gate schedule")
	}
	if result.RowsAffected == 0 {
		return utils.NotFound(c, "Gate schedule not found")
	}
	return utils.Success(c, nil)
}

func (h *GateScheduleHandler) Submit(c *fiber.Ctx) error {
	id := c.Params("id")
	var schedule models.GateSchedule
	if err := config.DB.First(&schedule, "id = ?", id).Error; err != nil {
		return utils.NotFound(c, "Gate schedule not found")
	}

	schedule.Status = "pending_approval"
	if err := config.DB.Save(&schedule).Error; err != nil {
		return utils.InternalError(c, "Failed to submit gate schedule")
	}

	approval := models.ApprovalRecord{
		BusinessID:   schedule.ID,
		BusinessType: "gate_schedule",
		ApprovalType: "submit",
		ApproverName: schedule.OperatorName,
		ApprovalResult: "submitted",
		ApprovedAt:   time.Now(),
	}
	config.DB.Create(&approval)

	return utils.Success(c, schedule)
}

func (h *GateScheduleHandler) GetCurveData(c *fiber.Ctx) error {
	startDateStr := c.Query("start_date", time.Now().AddDate(0, 0, -7).Format("2006-01-02"))
	endDateStr := c.Query("end_date", time.Now().Format("2006-01-02"))

	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		return utils.BadRequest(c, "Invalid start date")
	}
	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		return utils.BadRequest(c, "Invalid end date")
	}

	data, err := h.service.GenerateScheduleCurveData(startDate, endDate)
	if err != nil {
		return utils.InternalError(c, "Failed to generate curve data")
	}

	return utils.Success(c, data)
}

func (h *GateScheduleHandler) GetDetail(c *fiber.Ctx) error {
	id := c.Params("id")
	var schedule models.GateSchedule
	if err := config.DB.First(&schedule, "id = ?", id).Error; err != nil {
		return utils.NotFound(c, "Gate schedule not found")
	}

	var actualOpenings []models.GateActualOpening
	config.DB.Where("schedule_id = ?", id).Order("record_time DESC").Find(&actualOpenings)

	var waterSupplyImpacts []models.WaterSupplyImpact
	config.DB.Where("schedule_id = ?", id).Find(&waterSupplyImpacts)

	var ecologicalFlows []models.EcologicalFlowConfirmation
	config.DB.Where("schedule_id = ?", id).Find(&ecologicalFlows)

	var approvals []models.ApprovalRecord
	config.DB.Where("business_id = ? AND business_type = ?", id, "gate_schedule").Order("approved_at DESC").Find(&approvals)

	detail := map[string]interface{}{
		"schedule":           schedule,
		"actual_openings":    actualOpenings,
		"water_supply_impact": waterSupplyImpacts,
		"ecological_flow":    ecologicalFlows,
		"approvals":          approvals,
	}

	return utils.Success(c, detail)
}
