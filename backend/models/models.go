package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BaseModel struct {
	ID        string         `gorm:"type:uuid;primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (b *BaseModel) BeforeCreate(tx *gorm.DB) error {
	if b.ID == "" {
		b.ID = uuid.New().String()
	}
	return nil
}

type WaterLevelRecord struct {
	BaseModel
	RecordTime   time.Time `gorm:"not null;index" json:"record_time"`
	UpstreamInflow float64 `gorm:"type:decimal(10,2);not null" json:"upstream_inflow"`
	DownstreamWaterLevel float64 `gorm:"type:decimal(10,2);not null" json:"downstream_water_level"`
	ReservoirLevel float64 `gorm:"type:decimal(10,2)" json:"reservoir_level"`
	OperatorID   string `gorm:"type:uuid" json:"operator_id"`
	OperatorName string `gorm:"type:varchar(100)" json:"operator_name"`
	Remark       string `gorm:"type:text" json:"remark"`
}

type GateSchedule struct {
	BaseModel
	ScheduleDate    time.Time `gorm:"not null;index" json:"schedule_date"`
	GateNo          string    `gorm:"type:varchar(50);not null" json:"gate_no"`
	PlannedOpening  float64   `gorm:"type:decimal(10,2);not null" json:"planned_opening"`
	PlannedDischarge float64  `gorm:"type:decimal(10,2);not null" json:"planned_discharge"`
	StartTime       time.Time `json:"start_time"`
	EndTime         time.Time `json:"end_time"`
	Status          string    `gorm:"type:varchar(20);default:draft" json:"status"`
	OperatorID      string    `gorm:"type:uuid" json:"operator_id"`
	OperatorName    string    `gorm:"type:varchar(100)" json:"operator_name"`
	Remark          string    `gorm:"type:text" json:"remark"`
}

type GateActualOpening struct {
	BaseModel
	ScheduleID    string    `gorm:"type:uuid;index" json:"schedule_id"`
	GateNo        string    `gorm:"type:varchar(50);not null" json:"gate_no"`
	ActualOpening float64   `gorm:"type:decimal(10,2);not null" json:"actual_opening"`
	ActualDischarge float64 `gorm:"type:decimal(10,2);not null" json:"actual_discharge"`
	RecordTime    time.Time `gorm:"not null;index" json:"record_time"`
	Deviation     float64   `gorm:"type:decimal(10,2)" json:"deviation"`
	IsDeviationExceeded bool `gorm:"default:false" json:"is_deviation_exceeded"`
	DeviationReason string  `gorm:"type:text" json:"deviation_reason"`
	OperatorID    string    `gorm:"type:uuid" json:"operator_id"`
	OperatorName  string    `gorm:"type:varchar(100)" json:"operator_name"`
}

type EcologicalFlowConfirmation struct {
	BaseModel
	ScheduleID       string    `gorm:"type:uuid;index" json:"schedule_id"`
	MinRequiredFlow  float64   `gorm:"type:decimal(10,2);not null" json:"min_required_flow"`
	ConfirmedFlow    float64   `gorm:"type:decimal(10,2);not null" json:"confirmed_flow"`
	IsSufficient     bool      `gorm:"default:true" json:"is_sufficient"`
	CompensationNote string    `gorm:"type:text" json:"compensation_note"`
	ConfirmedAt      time.Time `json:"confirmed_at"`
	ConfirmerID      string    `gorm:"type:uuid" json:"confirmer_id"`
	ConfirmerName    string    `gorm:"type:varchar(100)" json:"confirmer_name"`
	Status           string    `gorm:"type:varchar(20);default:pending" json:"status"`
}

type WaterSupplyImpact struct {
	BaseModel
	ScheduleID      string    `gorm:"type:uuid;index" json:"schedule_id"`
	WaterSupplyUnit string    `gorm:"type:varchar(200);not null" json:"water_supply_unit"`
	EstimatedIntake float64   `gorm:"type:decimal(10,2)" json:"estimated_intake"`
	ImpactLevel     string    `gorm:"type:varchar(20)" json:"impact_level"`
	ImpactDesc      string    `gorm:"type:text" json:"impact_desc"`
	ViewedAt        time.Time `json:"viewed_at"`
	ViewerID        string    `gorm:"type:uuid" json:"viewer_id"`
	ViewerName      string    `gorm:"type:varchar(100)" json:"viewer_name"`
}

type ApprovalRecord struct {
	BaseModel
	BusinessID   string    `gorm:"type:uuid;index" json:"business_id"`
	BusinessType string    `gorm:"type:varchar(50);not null" json:"business_type"`
	ApprovalType string    `gorm:"type:varchar(50);not null" json:"approval_type"`
	ApproverID   string    `gorm:"type:uuid" json:"approver_id"`
	ApproverName string    `gorm:"type:varchar(100)" json:"approver_name"`
	ApprovalResult string  `gorm:"type:varchar(20);not null" json:"approval_result"`
	ApprovalOpinion string `gorm:"type:text" json:"approval_opinion"`
	ApprovedAt   time.Time `json:"approved_at"`
}

type WarningRecord struct {
	BaseModel
	WarningType   string    `gorm:"type:varchar(50);not null" json:"warning_type"`
	WarningLevel  string    `gorm:"type:varchar(20);not null" json:"warning_level"`
	WarningMsg    string    `gorm:"type:text;not null" json:"warning_msg"`
	BusinessID    string    `gorm:"type:uuid" json:"business_id"`
	BusinessType  string    `gorm:"type:varchar(50)" json:"business_type"`
	IsHandled     bool      `gorm:"default:false" json:"is_handled"`
	HandledAt     time.Time `json:"handled_at"`
	HandlerID     string    `gorm:"type:uuid" json:"handler_id"`
	HandlerName   string    `gorm:"type:varchar(100)" json:"handler_name"`
	HandleRemark  string    `gorm:"type:text" json:"handle_remark"`
}
