package postgres

import (
	"api/_internal/models"
	"api/_internal/repository"
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type appointmentRepo struct {
	pool *pgxpool.Pool
}

// NewAppointmentRepository crea una nueva instancia del repositorio usando el pool singleton.
func NewAppointmentRepository(ctx context.Context) (repository.AppointmentRepository, error) {
	p, err := GetPool(ctx)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo el pool de base de datos: %w", err)
	}
	return &appointmentRepo{pool: p}, nil
}

func (r *appointmentRepo) ListByMedico(ctx context.Context, medicoID uuid.UUID) ([]models.Cita, error) {
	query := `SELECT c.id, c.paciente_id, c.medico_id, c.fecha_hora, c.duracion_minutos, c.estado, 
	          COALESCE(c.notas, ''), c.created_at, c.updated_at, p.nombre_completo as paciente_nombre
	          FROM citas c
	          INNER JOIN pacientes p ON c.paciente_id = p.id
	          WHERE c.medico_id = $1
	          ORDER BY c.fecha_hora DESC`

	rows, err := r.pool.Query(ctx, query, medicoID)
	if err != nil {
		log.Printf("❌ REPO ERROR: Error ejecutando query ListByMedico (Citas): %v", err)
		return nil, fmt.Errorf("error listando citas: %w", err)
	}
	defer rows.Close()

	var citas []models.Cita
	for rows.Next() {
		var c models.Cita
		err := rows.Scan(
			&c.ID, &c.PacienteID, &c.MedicoID, &c.FechaHora, &c.DuracionMinutos, &c.Estado,
			&c.Notas, &c.CreatedAt, &c.UpdatedAt, &c.PacienteNombre,
		)
		if err != nil {
			log.Printf("❌ REPO ERROR: Error escaneando cita: %v", err)
			return nil, fmt.Errorf("error escaneando cita: %w", err)
		}
		citas = append(citas, c)
	}
	return citas, nil
}

func (r *appointmentRepo) Create(ctx context.Context, c *models.Cita) error {
	query := `INSERT INTO citas (paciente_id, medico_id, fecha_hora, duracion_minutos, estado, notas)
	          VALUES ($1, $2, $3, $4, $5, $6)
	          RETURNING id, created_at, updated_at`

	err := r.pool.QueryRow(ctx, query,
		c.PacienteID, c.MedicoID, c.FechaHora, c.DuracionMinutos, c.Estado, c.Notas,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)

	if err != nil {
		return fmt.Errorf("error creando cita: %w", err)
	}
	return nil
}

func (r *appointmentRepo) Update(ctx context.Context, c *models.Cita) error {
	query := `UPDATE citas
	          SET paciente_id = $1, fecha_hora = $2, duracion_minutos = $3, estado = $4, notas = $5, updated_at = NOW()
	          WHERE id = $6 AND medico_id = $7`

	result, err := r.pool.Exec(ctx, query,
		c.PacienteID, c.FechaHora, c.DuracionMinutos, c.Estado, c.Notas, c.ID, c.MedicoID,
	)
	if err != nil {
		return fmt.Errorf("error actualizando cita: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("no se encontró la cita o no tiene permisos")
	}
	return nil
}

func (r *appointmentRepo) Delete(ctx context.Context, id uuid.UUID, medicoID uuid.UUID) error {
	result, err := r.pool.Exec(ctx, "DELETE FROM citas WHERE id = $1 AND medico_id = $2", id, medicoID)
	if err != nil {
		return fmt.Errorf("error eliminando cita: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("no se encontró la cita o no tiene permisos")
	}
	return nil
}
