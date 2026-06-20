package services

import (
	"errors"
	"math"
	"math/rand"
	"reservoir-gate-scheduling/config"
	"reservoir-gate-scheduling/models"
	"time"
)

type SchedulingService struct{}

func NewSchedulingService() *SchedulingService {
	return &SchedulingService{}
}

func (s *SchedulingService) ValidateGateSchedule(schedule *models.GateSchedule, latestWaterLevel *models.WaterLevelRecord) error {
	if latestWaterLevel == nil {
		return nil
	}

	if latestWaterLevel.DownstreamWaterLevel >= config.AppConfig.WarningWaterLevel {
		if schedule.PlannedDischarge > latestWaterLevel.UpstreamInflow {
			return errors.New("下游水位已超警戒水位，禁止执行加大下泄调度")
		}
	}

	return nil
}

func (s *SchedulingService) ValidateEcologicalFlow(confirmation *models.EcologicalFlowConfirmation) (bool, error) {
	if confirmation.ConfirmedFlow < config.AppConfig.MinEcologicalFlow {
		confirmation.IsSufficient = false
		return false, errors.New("生态流量不足，需生成补偿说明")
	}
	confirmation.IsSufficient = true
	return true, nil
}

func (s *SchedulingService) CheckGateDeviation(actual *models.GateActualOpening, plannedOpening float64) (float64, bool) {
	deviation := math.Abs(actual.ActualOpening - plannedOpening)
	actual.Deviation = deviation
	actual.IsDeviationExceeded = deviation > config.AppConfig.GateDeviationThreshold
	return deviation, actual.IsDeviationExceeded
}

func (s *SchedulingService) GenerateWarning(warningType, warningLevel, warningMsg, businessID, businessType string) *models.WarningRecord {
	return &models.WarningRecord{
		WarningType:  warningType,
		WarningLevel: warningLevel,
		WarningMsg:   warningMsg,
		BusinessID:   businessID,
		BusinessType: businessType,
		IsHandled:    false,
	}
}

func (s *SchedulingService) CalculateWaterImpact(schedule *models.GateSchedule, waterSupplyUnit string) *models.WaterSupplyImpact {
	impact := &models.WaterSupplyImpact{
		ScheduleID:      schedule.ID,
		WaterSupplyUnit: waterSupplyUnit,
		EstimatedIntake: schedule.PlannedDischarge * 0.3,
	}

	switch {
	case schedule.PlannedDischarge < 20:
		impact.ImpactLevel = "high"
		impact.ImpactDesc = "下泄流量较小，可能严重影响取水"
	case schedule.PlannedDischarge < 50:
		impact.ImpactLevel = "medium"
		impact.ImpactDesc = "下泄流量中等，对取水有一定影响"
	default:
		impact.ImpactLevel = "low"
		impact.ImpactDesc = "下泄流量充足，取水基本不受影响"
	}

	return impact
}

func (s *SchedulingService) GenerateScheduleCurveData(startDate, endDate time.Time) ([]map[string]interface{}, error) {
	var data []map[string]interface{}
	current := startDate

	for current.Before(endDate) || current.Equal(endDate) {
		hourlyData := map[string]interface{}{
			"time":              current.Format("2006-01-02 15:04"),
			"planned_discharge": 30 + math.Sin(float64(current.Hour())/6.0)*20,
			"actual_discharge":  30 + math.Sin(float64(current.Hour())/6.0)*20 + (rand.Float64()*10 - 5),
			"water_level":       32 + math.Sin(float64(current.Day())/5.0)*3,
			"inflow":            40 + math.Cos(float64(current.Hour())/8.0)*15,
		}
		data = append(data, hourlyData)
		current = current.Add(time.Hour)
	}

	return data, nil
}
