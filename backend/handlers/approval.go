package handlers

import (
	"reservoir-gate-scheduling/config"
	"reservoir-gate-scheduling/models"
	"reservoir-gate-scheduling/utils"
	"time"

	"github.com/gofiber/fiber/v2"
)

type ApprovalHandler struct{}

func NewApprovalHandler() *ApprovalHandler {
	return &ApprovalHandler{}
}

func (h *ApprovalHandler) Create(c *fiber.Ctx) error {
	var approval models.ApprovalRecord
	if err := c.BodyParser(&approval); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	if approval.ApprovedAt.IsZero() {
		approval.ApprovedAt = time.Now()
	}

	if err := config.DB.Create(&approval).Error; err != nil {
		return utils.InternalError(c, "Failed to create approval record")
	}

	return utils.Success(c, approval)
}

func (h *ApprovalHandler) List(c *fiber.Ctx) error {
	var approvals []models.ApprovalRecord
	query := config.DB.Order("approved_at DESC")

	businessID := c.Query("business_id")
	businessType := c.Query("business_type")

	if businessID != "" {
		query = query.Where("business_id = ?", businessID)
	}
	if businessType != "" {
		query = query.Where("business_type = ?", businessType)
	}

	if err := query.Find(&approvals).Error; err != nil {
		return utils.InternalError(c, "Failed to query approval records")
	}

	return utils.Success(c, approvals)
}

func (h *ApprovalHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")
	var approval models.ApprovalRecord
	if err := config.DB.First(&approval, "id = ?", id).Error; err != nil {
		return utils.NotFound(c, "Approval record not found")
	}
	return utils.Success(c, approval)
}

func (h *ApprovalHandler) Approve(c *fiber.Ctx) error {
	businessID := c.Params("business_id")
	businessType := c.Params("business_type")

	var req struct {
		ApproverID     string `json:"approver_id"`
		ApproverName   string `json:"approver_name"`
		ApprovalOpinion string `json:"approval_opinion"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	approval := models.ApprovalRecord{
		BusinessID:      businessID,
		BusinessType:    businessType,
		ApprovalType:    "approval",
		ApproverID:      req.ApproverID,
		ApproverName:    req.ApproverName,
		ApprovalResult:  "approved",
		ApprovalOpinion: req.ApprovalOpinion,
		ApprovedAt:      time.Now(),
	}

	if err := config.DB.Create(&approval).Error; err != nil {
		return utils.InternalError(c, "Failed to create approval record")
	}

	if businessType == "gate_schedule" {
		config.DB.Model(&models.GateSchedule{}).
			Where("id = ?", businessID).
			Update("status", "approved")
	}

	return utils.Success(c, approval)
}

func (h *ApprovalHandler) Reject(c *fiber.Ctx) error {
	businessID := c.Params("business_id")
	businessType := c.Params("business_type")

	var req struct {
		ApproverID      string `json:"approver_id"`
		ApproverName    string `json:"approver_name"`
		ApprovalOpinion string `json:"approval_opinion"`
	}
	if err := c.BodyParser(&req); err != nil {
		return utils.BadRequest(c, "Invalid request body")
	}

	approval := models.ApprovalRecord{
		BusinessID:      businessID,
		BusinessType:    businessType,
		ApprovalType:    "approval",
		ApproverID:      req.ApproverID,
		ApproverName:    req.ApproverName,
		ApprovalResult:  "rejected",
		ApprovalOpinion: req.ApprovalOpinion,
		ApprovedAt:      time.Now(),
	}

	if err := config.DB.Create(&approval).Error; err != nil {
		return utils.InternalError(c, "Failed to create approval record")
	}

	if businessType == "gate_schedule" {
		config.DB.Model(&models.GateSchedule{}).
			Where("id = ?", businessID).
			Update("status", "rejected")
	}

	return utils.Success(c, approval)
}
