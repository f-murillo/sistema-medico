package postgres

import (
	"api/_internal/models"
	"context"
	"fmt"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type doctorRepo struct {
	pool *pgxpool.Pool
}

func NewDoctorRepository(pool *pgxpool.Pool) *doctorRepo {
	return &doctorRepo{pool: pool}
}

func (r *doctorRepo) GetProfile(ctx context.Context, id uuid.UUID) (*models.Medico, error) {
	var m models.Medico
	query := `SELECT id, nombre_completo, COALESCE(especialidad, ''), COALESCE(cedula_profesional, ''), created_at, updated_at 
              FROM medicos WHERE id = $1`
	
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&m.ID, &m.NombreCompleto, &m.Especialidad, &m.CedulaProfesional, &m.CreatedAt, &m.UpdatedAt,
	)
	
	if err != nil {
		return nil, fmt.Errorf("error obteniendo perfil: %w", err)
	}
	
	return &m, nil
}

func (r *doctorRepo) UpdateProfile(ctx context.Context, m *models.Medico) error {
	query := `UPDATE medicos 
              SET nombre_completo = $1, especialidad = $2, cedula_profesional = $3, updated_at = NOW() 
              WHERE id = $4`
	
	_, err := r.pool.Exec(ctx, query, m.NombreCompleto, m.Especialidad, m.CedulaProfesional, m.ID)
	if err != nil {
		return fmt.Errorf("error actualizando perfil: %w", err)
	}
	
	return nil
}

// EnsureExists verifica si el médico existe, si no, lo crea (útil para el primer login)
func (r *doctorRepo) EnsureExists(ctx context.Context, id uuid.UUID, nombre string) error {
	var exists bool
	err := r.pool.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM medicos WHERE id = $1)", id).Scan(&exists)
	if err != nil {
		return err
	}
	
	if !exists {
		_, err = r.pool.Exec(ctx, "INSERT INTO medicos (id, nombre_completo) VALUES ($1, $2)", id, nombre)
		if err != nil {
			return fmt.Errorf("error creando registro inicial de médico: %w", err)
		}
	}
	
	return nil
}
