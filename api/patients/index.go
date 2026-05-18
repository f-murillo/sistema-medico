package patients

import (
	"api/_internal/auth"
	"api/_internal/models"
	"api/_internal/repository/postgres"
	"encoding/json"
	"log"
	"net/http"

	"github.com/google/uuid"
)

// Handler es el punto de entrada para Vercel Serverless.
func Handler(w http.ResponseWriter, r *http.Request) {
	// Aplicar CORS primero
	auth.CORSMiddleware(func(w http.ResponseWriter, r *http.Request) {
		// Envolvemos el handler con el middleware de autenticación
		auth.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()

			// Obtenemos el userID del contexto (inyectado por el middleware)
			userIDStr, ok := ctx.Value(auth.UserIDKey).(string)
			if !ok {
				http.Error(w, "No se pudo identificar al médico", http.StatusUnauthorized)
				return
			}

			medicoID, err := uuid.Parse(userIDStr)
			if err != nil {
				http.Error(w, "ID de médico inválido", http.StatusInternalServerError)
				return
			}

			// Inicializamos el repositorio
			repo, err := postgres.NewPatientRepository(ctx)
			if err != nil {
				http.Error(w, "Error de conexión a base de datos", http.StatusInternalServerError)
				return
			}

			switch r.Method {
			case http.MethodGet:
				// Si viene un ID, devolvemos el paciente individual
				idStr := r.URL.Query().Get("id")
				if idStr != "" {
					patientID, err := uuid.Parse(idStr)
					if err != nil {
						http.Error(w, "ID de paciente inválido", http.StatusBadRequest)
						return
					}

					// Si también viene ?history=true, devolvemos la historia
					if r.URL.Query().Get("history") == "true" {
						historias, err := repo.ListHistoryByPatient(ctx, patientID)
						if err != nil {
							http.Error(w, "Error al listar historias", http.StatusInternalServerError)
							return
						}
						w.Header().Set("Content-Type", "application/json")
						json.NewEncoder(w).Encode(historias)
						return
					}

					paciente, err := repo.GetByID(ctx, patientID)
					if err != nil {
						http.Error(w, "Paciente no encontrado", http.StatusNotFound)
						return
					}
					w.Header().Set("Content-Type", "application/json")
					json.NewEncoder(w).Encode(paciente)
					return
				}

				log.Printf("DEBUG: Ejecutando ListByMedico para %s", medicoID)
				pacientes, err := repo.ListByMedico(ctx, medicoID)
				if err != nil {
					log.Printf("❌ HANDLER ERROR: Error al listar pacientes: %v", err)
					http.Error(w, "Error al listar pacientes", http.StatusInternalServerError)
					return
				}
				log.Printf("✅ HANDLER: Pacientes recuperados: %d", len(pacientes))
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(pacientes)

			case http.MethodPost:
				var p models.Paciente
				if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
					http.Error(w, "Formato de datos inválido", http.StatusBadRequest)
					return
				}

				p.MedicoID = medicoID
				if err := repo.Create(ctx, &p); err != nil {
					http.Error(w, "Error al crear paciente", http.StatusInternalServerError)
					return
				}

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusCreated)
				json.NewEncoder(w).Encode(p)

			case http.MethodPut:
				var p models.Paciente
				if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
					http.Error(w, "Formato de datos inválido", http.StatusBadRequest)
					return
				}

				p.MedicoID = medicoID
				if err := repo.Update(ctx, &p); err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				w.WriteHeader(http.StatusOK)

			case http.MethodDelete:
				idStr := r.URL.Query().Get("id")
				if idStr == "" {
					http.Error(w, "ID requerido", http.StatusBadRequest)
					return
				}
				patientID, err := uuid.Parse(idStr)
				if err != nil {
					http.Error(w, "ID inválido", http.StatusBadRequest)
					return
				}

				if err := repo.Delete(ctx, patientID, medicoID); err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				w.WriteHeader(http.StatusNoContent)

			default:
				http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
			}
		})(w, r)
	})(w, r)
}
