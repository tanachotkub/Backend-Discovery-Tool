package config

import (
	"os"
)

type Config struct {
	Port    string
	AppName string
	AppEnv  string
}

func Load() *Config {
	return &Config{
		Port:    getEnv("PORT", "8080"),
		AppName: getEnv("APP_NAME", "Backend Discovery Tool"),
		AppEnv:  getEnv("APP_ENV", "development"),
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
