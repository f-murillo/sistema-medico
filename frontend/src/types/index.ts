export interface Paciente {
  id: string
  medico_id: string
  nombre_completo: string
  cedula: string
  fecha_nacimiento: string
  genero: string
  telefono: string
  email: string
  seguro_compania: string
  seguro_poliza: string
  contacto_emergencia_nombre: string
  contacto_emergencia_telefono: string
  alergias: string
  antecedentes: string
  tratamiento_actual: string
  es_afiliado: boolean
  tipo_afiliacion: string
  titular_nombre?: string | null
  created_at: string
  updated_at: string
}

export interface HistoriaClinica {
  id: string
  paciente_id: string
  medico_id: string
  fecha_consulta: string
  motivo_consulta: string
  diagnostico: string
  tratamiento: string
  notas_generales: string
  metadatos: Record<string, any>
  created_at: string
}

export interface Documento {
  id: string
  paciente_id: string
  nombre: string
  storage_path: string
  tipo: string
  created_at: string
}

export interface Cita {
  id: string
  paciente_id: string
  medico_id: string
  fecha_hora: string
  duracion_minutos: number
  estado: 'programada' | 'completada' | 'cancelada' | 'ausente'
  notas: string
  created_at: string
  updated_at: string
  paciente_nombre?: string
}
