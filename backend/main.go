package main

import (
	"log"
	"reservoir-gate-scheduling/config"
	"reservoir-gate-scheduling/middleware"
	"reservoir-gate-scheduling/models"
	"reservoir-gate-scheduling/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	if _, err := config.LoadConfig(); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	if _, err := config.InitDB(); err != nil {
		log.Printf("Warning: Could not connect to database: %v", err)
		log.Println("Continuing without database connection...")
	}

	if config.DB != nil {
		config.DB.AutoMigrate(
			&models.WaterLevelRecord{},
			&models.GateSchedule{},
			&models.GateActualOpening{},
			&models.EcologicalFlowConfirmation{},
			&models.WaterSupplyImpact{},
			&models.ApprovalRecord{},
			&models.WarningRecord{},
		)
		log.Println("Database migration completed")
	}

	app := fiber.New(fiber.Config{
		AppName:      "水库闸门调度系统",
		ReadTimeout:  30000000000,
		WriteTimeout: 30000000000,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	app.Use(middleware.Logger())
	app.Use(middleware.RequestID())
	app.Use(middleware.Recover())
	app.Use(middleware.DBCheck())

	routes.SetupRoutes(app)

	log.Printf("Server starting on port %s", config.AppConfig.Port)
	if err := app.Listen(":" + config.AppConfig.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
