package history

import (
	"encoding/json"
	"log"
	"net/http"
	"api/_internal/auth"
	"api/_internal/models"
	"api/_internal/repository/postgres"
	"github.com/google/uuid"
)

// Handler maneja la creación de historias clínicas y vinculación de documentos.
func Handler(w http.ResponseWriter, r *http.Request) {
	auth.CORSMiddleware(func(w http.ResponseWriter, r *http.Request) {
		auth.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
			if r.Method != http.MethodPost && r.Method != http.MethodPut && r.Method != http.MethodDelete {
				http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
				return
			}

			ctx := r.Context()
			userIDStr, ok := ctx.Value(auth.UserIDKey).(string)
			if !ok {
				http.Error(w, "No se pudo identificar al médico", http.StatusUnauthorized)
				return
			}
			medicoID, err := uuid.Parse(userIDStr)
			if err != nil {
				http.Error(w, "ID de médico inválido", http.StatusBadRequest)
				return
			}

			repo, err := postgres.NewPatientRepository(ctx)
			if err != nil {
				http.Error(w, "Error de base de datos", http.StatusInternalServerError)
				return
			}

			if r.Method == http.MethodDelete {
				historyIDStr := r.URL.Query().Get("id")
				if historyIDStr == "" {
					http.Error(w, "ID de historia requerido", http.StatusBadRequest)
					return
				}
				historyID, err := uuid.Parse(historyIDStr)
				if err != nil {
					http.Error(w, "ID de historia inválido", http.StatusBadRequest)
					return
				}

				if err := repo.DeleteHistory(ctx, historyID, medicoID); err != nil {
					log.Printf("❌ ERROR ELIMINANDO HISTORIA: %v", err)
					http.Error(w, "Error eliminando historia: "+err.Error(), http.StatusInternalServerError)
					return
				}

				w.WriteHeader(http.StatusNoContent)
				return
			}

			var req struct {
				History      models.HistoriaClinica `json:"history"`
				StoragePaths []string               `json:"storage_paths"`
				DeletedPaths []string               `json:"deleted_paths"`
			}

			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, "Cuerpo de solicitud inválido", http.StatusBadRequest)
				return
			}

			req.History.MedicoID = medicoID

			if r.Method == http.MethodPut {
				err = repo.UpdateHistory(ctx, &req.History, req.StoragePaths, req.DeletedPaths)
			} else {
				err = repo.CreateHistoryWithDocuments(ctx, &req.History, req.StoragePaths)
			}

			if err != nil {
				log.Printf("❌ ERROR ACTUALIZANDO/CREANDO HISTORIA: %v", err)
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusCreated)
			json.NewEncoder(w).Encode(req.History)
		})(w, r)
	})(w, r)
}
