package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port     string
	AppName  string
	AppEnv   string
	DBDsn    string
	RedisURL string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using system environment")
	}

	return &Config{
		Port:     getEnv("PORT", "8080"),
		AppName:  getEnv("APP_NAME", "Backend Discovery Tool"),
		AppEnv:   getEnv("APP_ENV", "development"),
		DBDsn:    getEnv("DB_DSN", ""),
		RedisURL: getEnv("REDIS_URL", "redis://localhost:6379"),
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
