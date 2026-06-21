package routes

import (
	"reservoir-gate-scheduling/config"
	"reservoir-gate-scheduling/handlers"

	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	waterLevelHandler := handlers.NewWaterLevelHandler()
	waterLevel := api.Group("/water-level")
	{
		waterLevel.Post("/", waterLevelHandler.Create)
		waterLevel.Get("/", waterLevelHandler.List)
		waterLevel.Get("/latest", waterLevelHandler.GetLatest)
		waterLevel.Get("/:id", waterLevelHandler.Get)
		waterLevel.Put("/:id", waterLevelHandler.Update)
		waterLevel.Delete("/:id", waterLevelHandler.Delete)
	}

	gateScheduleHandler := handlers.NewGateScheduleHandler()
	gateSchedule := api.Group("/gate-schedule")
	{
		gateSchedule.Post("/", gateScheduleHandler.Create)
		gateSchedule.Get("/", gateScheduleHandler.List)
		gateSchedule.Get("/curve", gateScheduleHandler.GetCurveData)
		gateSchedule.Get("/:id", gateScheduleHandler.Get)
		gateSchedule.Get("/:id/detail", gateScheduleHandler.GetDetail)
		gateSchedule.Put("/:id", gateScheduleHandler.Update)
		gateSchedule.Delete("/:id", gateScheduleHandler.Delete)
		gateSchedule.Post("/:id/submit", gateScheduleHandler.Submit)
	}

	gateActualHandler := handlers.NewGateActualOpeningHandler()
	gateActual := api.Group("/gate-actual")
	{
		gateActual.Post("/", gateActualHandler.Create)
		gateActual.Get("/", gateActualHandler.List)
		gateActual.Get("/:id", gateActualHandler.Get)
		gateActual.Put("/:id", gateActualHandler.Update)
	}

	ecoFlowHandler := handlers.NewEcologicalFlowHandler()
	ecoFlow := api.Group("/ecological-flow")
	{
		ecoFlow.Post("/", ecoFlowHandler.Create)
		ecoFlow.Get("/", ecoFlowHandler.List)
		ecoFlow.Get("/:id", ecoFlowHandler.Get)
		ecoFlow.Post("/:id/confirm", ecoFlowHandler.Confirm)
	}

	waterSupplyHandler := handlers.NewWaterSupplyImpactHandler()
	waterSupply := api.Group("/water-supply")
	{
		waterSupply.Post("/", waterSupplyHandler.Create)
		waterSupply.Get("/", waterSupplyHandler.List)
		waterSupply.Get("/:id", waterSupplyHandler.Get)
		waterSupply.Post("/:id/viewed", waterSupplyHandler.MarkViewed)
		waterSupply.Post("/generate/:schedule_id", waterSupplyHandler.GenerateImpact)
	}

	approvalHandler := handlers.NewApprovalHandler()
	approval := api.Group("/approval")
	{
		approval.Post("/", approvalHandler.Create)
		approval.Get("/", approvalHandler.List)
		approval.Get("/:id", approvalHandler.Get)
		approval.Post("/:business_type/:business_id/approve", approvalHandler.Approve)
		approval.Post("/:business_type/:business_id/reject", approvalHandler.Reject)
	}

	warningHandler := handlers.NewWarningHandler()
	warning := api.Group("/warning")
	{
		warning.Get("/", warningHandler.List)
		warning.Get("/stats", warningHandler.GetStats)
		warning.Get("/:id", warningHandler.Get)
		warning.Post("/:id/handle", warningHandler.Handle)
	}

	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":       "ok",
			"service":      "reservoir-gate-scheduling",
			"db_connected": config.DB != nil,
		})
	})
}
