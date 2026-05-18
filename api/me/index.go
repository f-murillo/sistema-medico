package me

import (
	"api/_internal/auth"
	"api/_internal/models"
	"api/_internal/repository/postgres"
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

func MeHandler(w http.ResponseWriter, r *http.Request) {
	auth.CORSMiddleware(func(w http.ResponseWriter, r *http.Request) {
		auth.AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()
			pool, err := postgres.GetPool(ctx)
			if err != nil {
				http.Error(w, "Error de base de datos", http.StatusInternalServerError)
				return
			}

			repo := postgres.NewDoctorRepository(pool)
			
			val := ctx.Value(auth.UserIDKey)
			if val == nil {
				http.Error(w, "No autorizado", http.StatusUnauthorized)
				return
			}
			userIDStr := val.(string)
			userID, err := uuid.Parse(userIDStr)
			if err != nil {
				http.Error(w, "ID de usuario inválido", http.StatusBadRequest)
				return
			}

			if r.Method == http.MethodGet {
				// Intentar asegurar que exista (por si se registró antes de este cambio)
				// El nombre lo sacamos del token si es posible, o usamos uno genérico
				repo.EnsureExists(ctx, userID, "Médico") 

				profile, err := repo.GetProfile(ctx, userID)
				if err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				json.NewEncoder(w).Encode(profile)
				return
			}

			if r.Method == http.MethodPut {
				var m models.Medico
				if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
					http.Error(w, "Formato inválido", http.StatusBadRequest)
					return
				}
				m.ID = userID

				if err := repo.UpdateProfile(ctx, &m); err != nil {
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}
				w.WriteHeader(http.StatusOK)
				return
			}

			http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
		})(w, r)
	})(w, r)
}
