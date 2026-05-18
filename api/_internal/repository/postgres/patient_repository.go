package postgres

import (
	"api/_internal/models"
	"api/_internal/repository"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type patientRepo struct {
	pool *pgxpool.Pool
}

// NewPatientRepository crea una nueva instancia del repositorio usando el pool singleton.
func NewPatientRepository(ctx context.Context) (repository.PatientRepository, error) {
	p, err := GetPool(ctx)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo el pool de base de datos: %w", err)
	}
	return &patientRepo{pool: p}, nil
}

func (r *patientRepo) ListByMedico(ctx context.Context, medicoID uuid.UUID) ([]models.Paciente, error) {
	query := `SELECT id, medico_id, nombre_completo, COALESCE(cedula, ''), fecha_nacimiento, COALESCE(genero, ''), 
              COALESCE(telefono, ''), COALESCE(email, ''), COALESCE(seguro_compania, ''), COALESCE(seguro_poliza, ''), 
              COALESCE(contacto_emergencia_nombre, ''), COALESCE(contacto_emergencia_telefono, ''), 
              COALESCE(alergias, ''), COALESCE(antecedentes, ''), COALESCE(tratamiento_actual, ''), 
              COALESCE(es_afiliado, false), COALESCE(tipo_afiliacion, 'Ninguna'), titular_nombre,
              created_at, updated_at 
              FROM pacientes WHERE medico_id = $1`

	rows, err := r.pool.Query(ctx, query, medicoID)
	if err != nil {
		log.Printf("❌ REPO ERROR: Error ejecutando query ListByMedico: %v", err)
		return nil, fmt.Errorf("error listando pacientes: %w", err)
	}
	defer rows.Close()

	var pacientes []models.Paciente
	for rows.Next() {
		var p models.Paciente
		err := rows.Scan(
			&p.ID, &p.MedicoID, &p.NombreCompleto, &p.Cedula, &p.FechaNacimiento, &p.Genero, &p.Telefono, &p.Email,
			&p.SeguroCompania, &p.SeguroPoliza, &p.ContactoEmergenciaNombre, &p.ContactoEmergenciaTelefono,
			&p.Alergias, &p.Antecedentes, &p.TratamientoActual,
			&p.EsAfiliado, &p.TipoAfiliacion, &p.TitularNombre,
			&p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			log.Printf("❌ REPO ERROR: Error escaneando paciente: %v", err)
			return nil, fmt.Errorf("error escaneando paciente: %w", err)
		}
		pacientes = append(pacientes, p)
	}
	return pacientes, nil
}

func (r *patientRepo) Create(ctx context.Context, p *models.Paciente) error {
	query := `INSERT INTO pacientes (medico_id, nombre_completo, cedula, fecha_nacimiento, genero, telefono, email, 
              seguro_compania, seguro_poliza, contacto_emergencia_nombre, contacto_emergencia_telefono,
              alergias, antecedentes, tratamiento_actual, es_afiliado, tipo_afiliacion, titular_nombre)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
              RETURNING id, created_at, updated_at`

	err := r.pool.QueryRow(ctx, query,
		p.MedicoID, p.NombreCompleto, p.Cedula, p.FechaNacimiento, p.Genero, p.Telefono, p.Email,
		p.SeguroCompania, p.SeguroPoliza, p.ContactoEmergenciaNombre, p.ContactoEmergenciaTelefono,
		p.Alergias, p.Antecedentes, p.TratamientoActual,
		p.EsAfiliado, p.TipoAfiliacion, p.TitularNombre,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)

	if err != nil {
		return fmt.Errorf("error creando paciente: %w", err)
	}
	return nil
}

func (r *patientRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Paciente, error) {
	query := `SELECT id, medico_id, nombre_completo, COALESCE(cedula, ''), fecha_nacimiento, COALESCE(genero, ''), 
              COALESCE(telefono, ''), COALESCE(email, ''), COALESCE(seguro_compania, ''), COALESCE(seguro_poliza, ''), 
              COALESCE(contacto_emergencia_nombre, ''), COALESCE(contacto_emergencia_telefono, ''), 
              COALESCE(alergias, ''), COALESCE(antecedentes, ''), COALESCE(tratamiento_actual, ''), 
              COALESCE(es_afiliado, false), COALESCE(tipo_afiliacion, 'Ninguna'), titular_nombre,
              created_at, updated_at 
              FROM pacientes WHERE id = $1`

	var p models.Paciente
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&p.ID, &p.MedicoID, &p.NombreCompleto, &p.Cedula, &p.FechaNacimiento, &p.Genero, &p.Telefono, &p.Email,
		&p.SeguroCompania, &p.SeguroPoliza, &p.ContactoEmergenciaNombre, &p.ContactoEmergenciaTelefono,
		&p.Alergias, &p.Antecedentes, &p.TratamientoActual,
		&p.EsAfiliado, &p.TipoAfiliacion, &p.TitularNombre,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("error obteniendo paciente: %w", err)
	}
	return &p, nil
}

func (r *patientRepo) Update(ctx context.Context, p *models.Paciente) error {
	query := `UPDATE pacientes 
              SET nombre_completo = $1, cedula = $2, fecha_nacimiento = $3, genero = $4, telefono = $5, email = $6, 
                  seguro_compania = $7, seguro_poliza = $8, contacto_emergencia_nombre = $9, 
                  contacto_emergencia_telefono = $10, alergias = $11, antecedentes = $12, tratamiento_actual = $13,
                  es_afiliado = $14, tipo_afiliacion = $15, titular_nombre = $16,
                  updated_at = NOW() 
              WHERE id = $17 AND medico_id = $18`
	
	result, err := r.pool.Exec(ctx, query, 
		p.NombreCompleto, p.Cedula, p.FechaNacimiento, p.Genero, p.Telefono, p.Email, 
		p.SeguroCompania, p.SeguroPoliza, p.ContactoEmergenciaNombre, 
		p.ContactoEmergenciaTelefono, p.Alergias, p.Antecedentes, p.TratamientoActual,
		p.EsAfiliado, p.TipoAfiliacion, p.TitularNombre,
		p.ID, p.MedicoID,
	)
	if err != nil {
		return fmt.Errorf("error actualizando paciente: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("no se encontró el paciente o no tiene permisos")
	}
	return nil
}

func (r *patientRepo) Delete(ctx context.Context, id uuid.UUID, medicoID uuid.UUID) error {
	result, err := r.pool.Exec(ctx, "DELETE FROM pacientes WHERE id = $1 AND medico_id = $2", id, medicoID)
	if err != nil {
		return fmt.Errorf("error eliminando paciente: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("no se encontró el paciente o no tiene permisos")
	}
	return nil
}

func (r *patientRepo) ListHistoryByPatient(ctx context.Context, pacienteID uuid.UUID) ([]models.HistoriaClinica, error) {
	// Usamos COALESCE y JSON_AGG para traer los documentos asociados en la misma consulta
	query := `
		SELECT 
			h.id, h.paciente_id, h.medico_id, h.fecha_consulta, h.motivo_consulta, 
			h.diagnostico, h.tratamiento, h.notas_generales, h.metadatos, h.created_at,
			COALESCE(
				(SELECT json_agg(json_build_object('nombre', d.nombre, 'storage_path', d.storage_path))
				 FROM documentos_paciente d 
				 WHERE d.historia_id = h.id), 
				'[]'
			) as documentos
		FROM historias_clinicas h 
		WHERE h.paciente_id = $1 
		ORDER BY h.fecha_consulta DESC`
	
	rows, err := r.pool.Query(ctx, query, pacienteID)
	if err != nil {
		return nil, fmt.Errorf("error listando historias clínicas: %w", err)
	}
	defer rows.Close()

	var historias []models.HistoriaClinica
	for rows.Next() {
		var h models.HistoriaClinica
		var documentosJSON []byte
		err := rows.Scan(
			&h.ID, &h.PacienteID, &h.MedicoID, &h.FechaConsulta, &h.MotivoConsulta, 
			&h.Diagnostico, &h.Tratamiento, &h.NotasGenerales, &h.Metadatos, &h.CreatedAt,
			&documentosJSON,
		)
		if err != nil {
			return nil, fmt.Errorf("error escaneando historia clínica: %w", err)
		}
		
		// Decodificamos los documentos del JSON al campo Metadatos temporalmente o podrías añadir un campo al modelo
		// Para mantenerlo simple y pragmático, lo meteremos en Metadatos bajo la llave "documentos"
		if h.Metadatos == nil {
			h.Metadatos = make(map[string]interface{})
		}
		var docs []map[string]interface{}
		json.Unmarshal(documentosJSON, &docs)
		h.Metadatos["documentos"] = docs

		historias = append(historias, h)
	}
	return historias, nil
}

func (r *patientRepo) UpdateHistory(ctx context.Context, h *models.HistoriaClinica, newPaths []string, deletedPaths []string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var metadatosJSON []byte
	if h.Metadatos != nil {
		metadatosJSON, err = json.Marshal(h.Metadatos)
		if err != nil {
			return fmt.Errorf("error serializando metadatos: %w", err)
		}
	} else {
		metadatosJSON = []byte("{}")
	}

	// 1. Actualizar la historia clínica
	query := `UPDATE historias_clinicas 
              SET motivo_consulta = $1, diagnostico = $2, tratamiento = $3, notas_generales = $4, metadatos = $5::jsonb 
              WHERE id = $6 AND medico_id = $7`
	
	result, err := tx.Exec(ctx, query, 
		h.MotivoConsulta, h.Diagnostico, h.Tratamiento, h.NotasGenerales, string(metadatosJSON), h.ID, h.MedicoID,
	)
	if err != nil {
		return fmt.Errorf("error actualizando historia: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("no se encontró la historia o no tiene permisos")
	}

	// 2. Eliminar documentos marcados
	if len(deletedPaths) > 0 {
		_, err = tx.Exec(ctx, "DELETE FROM documentos_paciente WHERE storage_path = ANY($1)", deletedPaths)
		if err != nil {
			return fmt.Errorf("error eliminando documentos: %w", err)
		}
	}

	// 3. Insertar nuevos documentos
	for _, path := range newPaths {
		fileName := path[strings.LastIndex(path, "/")+1:]
		_, err = tx.Exec(ctx, 
			"INSERT INTO documentos_paciente (paciente_id, historia_id, storage_path, nombre) VALUES ($1, $2, $3, $4)",
			h.PacienteID, h.ID, path, fileName,
		)
		if err != nil {
			return fmt.Errorf("error insertando nuevo documento: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (r *patientRepo) CreateHistoryWithDocuments(ctx context.Context, h *models.HistoriaClinica, storagePaths []string) error {
	// Usamos una transacción para asegurar que la historia y los documentos se guarden juntos
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("error iniciando transacción: %w", err)
	}
	defer tx.Rollback(ctx)

	var metadatosJSON []byte
	if h.Metadatos != nil {
		metadatosJSON, err = json.Marshal(h.Metadatos)
		if err != nil {
			return fmt.Errorf("error serializando metadatos: %w", err)
		}
	} else {
		metadatosJSON = []byte("{}")
	}

	// 1. Insertar Historia Clínica
	queryHistory := `INSERT INTO historias_clinicas (paciente_id, medico_id, motivo_consulta, diagnostico, tratamiento, notas_generales, metadatos)
                     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
                     RETURNING id, fecha_consulta, created_at`

	err = tx.QueryRow(ctx, queryHistory,
		h.PacienteID, h.MedicoID, h.MotivoConsulta, h.Diagnostico, h.Tratamiento, h.NotasGenerales, string(metadatosJSON),
	).Scan(&h.ID, &h.FechaConsulta, &h.CreatedAt)

	if err != nil {
		return fmt.Errorf("error insertando historia clínica: %w", err)
	}

	// 2. Insertar Documentos si existen
	if len(storagePaths) > 0 {
		for _, path := range storagePaths {
			queryDoc := `INSERT INTO documentos_paciente (paciente_id, historia_id, storage_path, nombre) 
                         VALUES ($1, $2, $3, $4)`
			_, err = tx.Exec(ctx, queryDoc, h.PacienteID, h.ID, path, "Documento Adjunto")
			if err != nil {
				return fmt.Errorf("error insertando documento %s: %w", path, err)
			}
		}
	}

	return tx.Commit(ctx)
}

func (r *patientRepo) DeleteHistory(ctx context.Context, id uuid.UUID, medicoID uuid.UUID) error {
	query := "DELETE FROM historias_clinicas WHERE id = $1 AND medico_id = $2"
	result, err := r.pool.Exec(ctx, query, id, medicoID)
	if err != nil {
		return fmt.Errorf("error eliminando historia clínica: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("historia no encontrada o sin permisos")
	}

	return nil
}
