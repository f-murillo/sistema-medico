package models

import (
	"time"

	"github.com/google/uuid"
)

// Paciente representa a una persona bajo cuidado médico.
type Paciente struct {
	ID                         uuid.UUID `json:"id"`
	MedicoID                   uuid.UUID `json:"medico_id"`
	NombreCompleto             string    `json:"nombre_completo"`
	Cedula                     string    `json:"cedula"`
	FechaNacimiento            time.Time `json:"fecha_nacimiento"`
	Genero                     string    `json:"genero"`
	Telefono                   string    `json:"telefono"`
	Email                      string    `json:"email"`
	SeguroCompania             string    `json:"seguro_compania"`
	SeguroPoliza               string    `json:"seguro_poliza"`
	ContactoEmergenciaNombre   string    `json:"contacto_emergencia_nombre"`
	ContactoEmergenciaTelefono string    `json:"contacto_emergencia_telefono"`
	Alergias                   string    `json:"alergias"`
	Antecedentes               string    `json:"antecedentes"`
	TratamientoActual          string    `json:"tratamiento_actual"`
	EsAfiliado                 bool      `json:"es_afiliado"`
	TipoAfiliacion             string    `json:"tipo_afiliacion"`
	TitularNombre              *string   `json:"titular_nombre,omitempty"`
	CreatedAt                  time.Time `json:"created_at"`
	UpdatedAt                  time.Time `json:"updated_at"`
}

// HistoriaClinica representa un registro de consulta médica.
type HistoriaClinica struct {
	ID             uuid.UUID              `json:"id"`
	PacienteID      uuid.UUID              `json:"paciente_id"`
	MedicoID        uuid.UUID              `json:"medico_id"`
	FechaConsulta   time.Time              `json:"fecha_consulta"`
	MotivoConsulta  string                 `json:"motivo_consulta"`
	Diagnostico     string                 `json:"diagnostico"`
	Tratamiento     string                 `json:"tratamiento"`
	NotasGenerales  string                 `json:"notas_generales"`
	Metadatos       map[string]interface{} `json:"metadatos"` // Flexible para campos jsonb
	CreatedAt       time.Time              `json:"created_at"`
}

// Documento representa un archivo adjunto a la historia del paciente (ej: radiografías).
type Documento struct {
	ID           uuid.UUID `json:"id"`
	PacienteID   uuid.UUID `json:"paciente_id"`
	Nombre       string    `json:"nombre"`
	StoragePath  string    `json:"storage_path"`
	Tipo         string    `json:"tipo"`
	CreatedAt    time.Time `json:"created_at"`
}

// Cita representa una cita médica programada entre un paciente y un médico.
type Cita struct {
	ID              uuid.UUID `json:"id"`
	PacienteID      uuid.UUID `json:"paciente_id"`
	MedicoID        uuid.UUID `json:"medico_id"`
	FechaHora       time.Time `json:"fecha_hora"`
	DuracionMinutos int       `json:"duracion_minutos"`
	Estado          string    `json:"estado"`
	Notas           string    `json:"notas"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	PacienteNombre  string    `json:"paciente_nombre,omitempty"` // JOIN con pacientes para listados
}
