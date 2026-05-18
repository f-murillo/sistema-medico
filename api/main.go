package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"api/appointments"
	"api/history"
	"api/me"
	"api/patients"
	"github.com/joho/godotenv"
)

type statusWrapper struct {
	http.ResponseWriter
	status int
}

func (w *statusWrapper) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func main() {
	// Intentamos cargar el .env de la carpeta local o de la raíz
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Middleware de logging para ver qué llega y qué respondemos
	loggingMiddleware := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			ww := &statusWrapper{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(ww, r)
			log.Printf("DEBUG: %s %s - Status: %d", r.Method, r.URL.Path, ww.status)
		}
	}

	// Mapeamos los handlers usando sus respectivos paquetes
	http.HandleFunc("/api/patients", loggingMiddleware(patients.Handler))
	http.HandleFunc("/api/history", loggingMiddleware(history.Handler))
	http.HandleFunc("/api/me", loggingMiddleware(me.MeHandler))
	http.HandleFunc("/api/appointments", loggingMiddleware(appointments.Handler))

	fmt.Printf("🚀 Servidor de desarrollo corriendo en http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
