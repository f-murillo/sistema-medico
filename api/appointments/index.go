package appointments

import (
	"api/_internal/auth"
	"api/_internal/models"
	"api/_internal/repository/postgres"
	"encoding/json"
	"log"
	"net/http"

	"github.com/google/uuid"
)

// Handler es el punto de entrada para Vercel Serverless para la entidad Citas.
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

			// Inicializamos el repositorio de citas
			repo, err := postgres.NewAppointmentRepository(ctx)
			if err != nil {
				http.Error(w, "Error de conexión a base de datos", http.StatusInternalServerError)
				return
			}

			switch r.Method {
			case http.MethodGet:
				log.Printf("DEBUG: Ejecutando ListByMedico (Citas) para %s", medicoID)
				citas, err := repo.ListByMedico(ctx, medicoID)
				if err != nil {
					log.Printf("❌ HANDLER ERROR: Error al listar citas: %v", err)
					http.Error(w, "Error al listar citas", http.StatusInternalServerError)
					return
				}
				log.Printf("✅ HANDLER: Citas recuperadas: %d", len(citas))
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(citas)

			case http.MethodPost:
				var c models.Cita
				if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
					http.Error(w, "Formato de datos inválido", http.StatusBadRequest)
					return
				}

				c.MedicoID = medicoID
				// Si no viene estado, por defecto es 'programada'
				if c.Estado == "" {
					c.Estado = "programada"
				}
				// Si no viene duración, por defecto es 30
				if c.DuracionMinutos == 0 {
					c.DuracionMinutos = 30
				}

				if err := repo.Create(ctx, &c); err != nil {
					log.Printf("❌ HANDLER ERROR: Error al crear cita: %v", err)
					http.Error(w, "Error al crear cita", http.StatusInternalServerError)
					return
				}

				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusCreated)
				json.NewEncoder(w).Encode(c)

			case http.MethodPut:
				var c models.Cita
				if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
					http.Error(w, "Formato de datos inválido", http.StatusBadRequest)
					return
				}

				c.MedicoID = medicoID
				if err := repo.Update(ctx, &c); err != nil {
					log.Printf("❌ HANDLER ERROR: Error al actualizar cita: %v", err)
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
				appointmentID, err := uuid.Parse(idStr)
				if err != nil {
					http.Error(w, "ID de cita inválido", http.StatusBadRequest)
					return
				}

				if err := repo.Delete(ctx, appointmentID, medicoID); err != nil {
					log.Printf("❌ HANDLER ERROR: Error al eliminar cita: %v", err)
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
