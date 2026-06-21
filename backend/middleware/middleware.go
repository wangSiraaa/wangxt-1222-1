package middleware

import (
	"log"
	"reservoir-gate-scheduling/config"
	"reservoir-gate-scheduling/utils"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

func Logger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		log.Printf("[%s] %s %s - %v",
			c.Method(),
			c.Path(),
			c.IP(),
			time.Since(start),
		)
		return err
	}
}

func RequestID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		requestID := c.Get("X-Request-ID")
		if requestID == "" {
			requestID = time.Now().Format("20060102150405")
		}
		c.Set("X-Request-ID", requestID)
		c.Locals("requestID", requestID)
		return c.Next()
	}
}

func Recover() fiber.Handler {
	return func(c *fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Recovered from panic: %v", r)
				msg := "Internal Server Error"
				code := 500
				if config.DB == nil {
					msg = "数据库服务未就绪，请检查 PostgreSQL 是否启动以及 .env 中 DB_* 配置是否正确"
					code = 503
				}
				c.Status(code).JSON(fiber.Map{
					"code":    code,
					"message": msg,
				})
			}
		}()
		return c.Next()
	}
}

func DBCheck() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if strings.HasSuffix(c.Path(), "/api/health") || c.Path() == "/health" {
			return c.Next()
		}
		if config.DB == nil {
			return utils.ServiceUnavailable(c,
				"数据库服务未就绪，请检查 PostgreSQL 是否已启动、reservoir_scheduling 库是否已创建、以及 backend/.env 中 DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME 配置是否正确")
		}
		return c.Next()
	}
}
