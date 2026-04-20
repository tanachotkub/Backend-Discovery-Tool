package middlewares

import (
	"context"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
)

// RateLimiter จำกัด 5 requests / minute / IP
func RateLimiter(rdb *redis.Client) fiber.Handler {
	return func(c *fiber.Ctx) error {
		ip := c.IP()
		key := fmt.Sprintf("rate_limit:%s", ip)
		ctx := context.Background()
		limit := 5
		window := time.Minute

		// ดึงค่าปัจจุบัน
		count, err := rdb.Get(ctx, key).Int()
		if err != nil && err != redis.Nil {
			// Redis error → ให้ผ่านไปก่อน (fail open)
			return c.Next()
		}

		if count >= limit {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"status":      "error",
				"message":     fmt.Sprintf("rate limit exceeded: max %d requests per minute", limit),
				"retry_after": "60s",
			})
		}

		// เพิ่ม counter
		pipe := rdb.Pipeline()
		pipe.Incr(ctx, key)
		if count == 0 {
			pipe.Expire(ctx, key, window) // set TTL เฉพาะครั้งแรก
		}
		pipe.Exec(ctx)

		// ใส่ header บอก client
		c.Set("X-RateLimit-Limit", fmt.Sprintf("%d", limit))
		c.Set("X-RateLimit-Remaining", fmt.Sprintf("%d", limit-count-1))

		return c.Next()
	}
}
