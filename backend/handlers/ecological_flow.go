package handlers

import (
	"reservoir-gate-scheduling/config"
	"reservoir-gate-scheduling/models"
	"reservoir-gate-scheduling/services"
	"reservoir-gate-scheduling/utils"
	"time"

	"github.com/gofiber/fiber/v2"
)

type EcologicalFlowHandler struct {
	service *services.SchedulingService
}

func NewEcologicalFlowHandler() *EcologicalFlowHandler {
	return &EcologicalFlowHandler{
		service: services.NewSchedulingService(),
	}
}

func (h *EcologicalFlowHandler) Create(c *fiber.Ctx) error {
	var confirmation models.EcologicalFlowConfirmation
	if err := c.BodyParser(&confirmation); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	if confirmation.Status == "" {
		confirmation.Status = "pending"
	}

	sufficient, err := h.service.ValidateEcologicalFlow(&confirmation)
	if !sufficient {
		if confirmation.CompensationNote == "" {
			return utils.BadRequest(c, "生态流量不足，必须填写补偿说明")
		}
	}

	if confirmation.Status == "confirmed" {
		confirmation.ConfirmedAt = time.Now()
	}

	if err := config.DB.Create(&confirmation).Error; err != nil {
		return utils.InternalError(c, "Failed to create ecological flow confirmation")
	}

	if !sufficient {
		warning := h.service.GenerateWarning(
			"ecological_flow",
			"high",
			"生态流量不足："+err.Error(),
			confirmation.ID,
			"ecological_flow",
		)
		config.DB.Create(warning)
	}

	return utils.Success(c, confirmation)
}

func (h *EcologicalFlowHandler) Confirm(c *fiber.Ctx) error {
	id := c.Params("id")
	var confirmation models.EcologicalFlowConfirmation
	if err := config.DB.First(&confirmation, "id = ?", id).Error; err != nil {
		return utils.NotFound(c, "Ecological flow confirmation not found")
	}

	var req struct {
		ConfirmedFlow    float64 `json:"confirmed_flow"`
		CompensationNote string  `json:"compensation_note"`
		ConfirmerID      string  `json:"confirmer_id"`
		ConfirmerName    string  `json:"confirmer_name"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	confirmation.ConfirmedFlow = req.ConfirmedFlow
	confirmation.CompensationNote = req.CompensationNote
	confirmation.ConfirmerID = req.ConfirmerID
	confirmation.ConfirmerName = req.ConfirmerName
	confirmation.Status = "confirmed"
	confirmation.ConfirmedAt = time.Now()

	sufficient, _ := h.service.ValidateEcologicalFlow(&confirmation)
	if !sufficient && confirmation.CompensationNote == "" {
		return utils.BadRequest(c, "生态流量不足，必须填写补偿说明")
	}

	if err := config.DB.Save(&confirmation).Error; err != nil {
		return utils.InternalError(c, "Failed to confirm ecological flow")
	}

	return utils.Success(c, confirmation)
}

func (h *EcologicalFlowHandler) List(c *fiber.Ctx) error {
	var confirmations []models.EcologicalFlowConfirmation
	query := config.DB.Order("created_at DESC")

	scheduleID := c.Query("schedule_id")
	status := c.Query("status")

	if scheduleID != "" {
		query = query.Where("schedule_id = ?", scheduleID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Find(&confirmations).Error; err != nil {
		return utils.InternalError(c, "Failed to query ecological flow confirmations")
	}

	return utils.Success(c, confirmations)
}

func (h *EcologicalFlowHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	var confirmation models.EcologicalFlowConfirmation
	if err := config.DB.First(&confirmation, "id = ?", id).Error; err != nil {
		return utils.NotFound(c, "Ecological flow confirmation not found")
	}
	return utils.Success(c, confirmation)
}
