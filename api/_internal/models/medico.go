package models

import (
	"time"
	"github.com/google/uuid"
)

type Medico struct {
	ID                uuid.UUID `json:"id"`
	NombreCompleto    string    `json:"nombre_completo"`
	Especialidad      string    `json:"especialidad"`
	CedulaProfesional string    `json:"cedula_profesional"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}
