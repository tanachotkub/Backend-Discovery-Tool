package main

import (
	"backend-discovery/config"
	"backend-discovery/routes"
	"log"
	"net/http"
)

func main() {
	cfg := config.Load()

	mux := routes.Setup()

	log.Printf("🚀 Backend Discovery API running on :%s", cfg.Port)
	log.Fatal(http.ListenAndServe(":"+cfg.Port, mux))
}
