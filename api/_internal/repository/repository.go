package repository

import (
	"context"
	"api/_internal/models"
	"github.com/google/uuid"
)

// PatientRepository define las operaciones permitidas sobre los datos de pacientes.
type PatientRepository interface {
	// ListByMedico devuelve todos los pacientes asociados a un médico.
	ListByMedico(ctx context.Context, medicoID uuid.UUID) ([]models.Paciente, error)
	
	// Create registra un nuevo paciente.
	Create(ctx context.Context, paciente *models.Paciente) error

	// GetByID devuelve un paciente por su ID.
	GetByID(ctx context.Context, id uuid.UUID) (*models.Paciente, error)

	// Update actualiza los datos de un paciente.
	Update(ctx context.Context, paciente *models.Paciente) error

	// Delete elimina un paciente.
	Delete(ctx context.Context, id uuid.UUID, medicoID uuid.UUID) error

	// ListHistoryByPatient devuelve la historia clínica de un paciente.
	ListHistoryByPatient(ctx context.Context, pacienteID uuid.UUID) ([]models.HistoriaClinica, error)

	// UpdateHistory actualiza una historia clínica existente y gestiona sus documentos.
	UpdateHistory(ctx context.Context, history *models.HistoriaClinica, newPaths []string, deletedPaths []string) error

	// CreateHistoryWithDocuments registra una consulta y asocia documentos opcionales.
	CreateHistoryWithDocuments(ctx context.Context, history *models.HistoriaClinica, storagePaths []string) error
}

// AppointmentRepository define las operaciones permitidas sobre las citas médicas.
type AppointmentRepository interface {
	// ListByMedico devuelve todas las citas programadas de un médico.
	ListByMedico(ctx context.Context, medicoID uuid.UUID) ([]models.Cita, error)

	// Create registra una nueva cita.
	Create(ctx context.Context, cita *models.Cita) error

	// Update actualiza los detalles de una cita.
	Update(ctx context.Context, cita *models.Cita) error

	// Delete elimina o cancela una cita del sistema.
	Delete(ctx context.Context, id uuid.UUID, medicoID uuid.UUID) error
}
