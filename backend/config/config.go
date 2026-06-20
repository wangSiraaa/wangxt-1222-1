package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                    string
	DBHost                  string
	DBPort                  string
	DBUser                  string
	DBPassword              string
	DBName                  string
	DBSSLMode               string
	WarningWaterLevel       float64
	MinEcologicalFlow       float64
	GateDeviationThreshold  float64
}

var AppConfig *Config

func LoadConfig() (*Config, error) {
	_ = godotenv.Load()

	warningLevel, _ := strconv.ParseFloat(getEnv("WARNING_WATER_LEVEL", "35.0"), 64)
	minEcoFlow, _ := strconv.ParseFloat(getEnv("MIN_ECOLOGICAL_FLOW", "10.0"), 64)
	deviationThreshold, _ := strconv.ParseFloat(getEnv("GATE_DEVIATION_THRESHOLD", "5.0"), 64)

	AppConfig = &Config{
		Port:                   getEnv("PORT", "3001"),
		DBHost:                 getEnv("DB_HOST", "localhost"),
		DBPort:                 getEnv("DB_PORT", "5432"),
		DBUser:                 getEnv("DB_USER", "postgres"),
		DBPassword:             getEnv("DB_PASSWORD", "postgres"),
		DBName:                 getEnv("DB_NAME", "reservoir_scheduling"),
		DBSSLMode:              getEnv("DB_SSLMODE", "disable"),
		WarningWaterLevel:      warningLevel,
		MinEcologicalFlow:      minEcoFlow,
		GateDeviationThreshold: deviationThreshold,
	}

	return AppConfig, nil
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func (c *Config) GetDSN() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode)
}
