package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port           string
	AppName        string
	AppEnv         string
	DBDsn          string
	RedisURL       string
	WorkerCount    int
	EdgeDriverPath string
	EdgeDriverPort int
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using system environment")
	}

	workerCount, _ := strconv.Atoi(getEnv("WORKER_COUNT", "3"))
	edgeDriverPort, _ := strconv.Atoi(getEnv("EDGE_DRIVER_PORT", "9515"))

	return &Config{
		Port:           getEnv("PORT", "8080"),
		AppName:        getEnv("APP_NAME", "Backend Discovery Tool"),
		AppEnv:         getEnv("APP_ENV", "development"),
		DBDsn:          getEnv("DB_DSN", ""),
		RedisURL:       getEnv("REDIS_URL", "redis://localhost:6379"),
		WorkerCount:    workerCount,
		EdgeDriverPath: getEnv("EDGE_DRIVER_PATH", "msedgedriver.exe"),
		EdgeDriverPort: edgeDriverPort,
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
