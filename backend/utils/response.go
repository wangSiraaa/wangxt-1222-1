package utils

import "github.com/gofiber/fiber/v2"

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func Success(c *fiber.Ctx, data interface{}) error {
	return c.JSON(Response{
		Code:    0,
		Message: "success",
		Data:    data,
	})
}

func Error(c *fiber.Ctx, code int, message string) error {
	return c.Status(code).JSON(Response{
		Code:    code,
		Message: message,
	})
}

func BadRequest(c *fiber.Ctx, message string) error {
	return Error(c, 400, message)
}

func NotFound(c *fiber.Ctx, message string) error {
	return Error(c, 404, message)
}

func InternalError(c *fiber.Ctx, message string) error {
	return Error(c, 500, message)
}
