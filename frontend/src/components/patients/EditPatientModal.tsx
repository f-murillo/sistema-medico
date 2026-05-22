import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, User, Shield, Heart, Activity, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePatients } from '@/hooks/usePatients'
import type { Paciente } from '@/types'
import MilitaryAffiliationFields from '@/components/patients/MilitaryAffiliationFields'
import {
  affiliationFields,
  mapAffiliationPayload,
  TIPO_AFILIACION_NINGUNA,
  withMilitaryAffiliationValidation,
} from '@/lib/patientSchema'

// 1. Esquema actualizado: Solo el nombre es obligatorio, la edad se valida como en la creación
const patientSchema = withMilitaryAffiliationValidation(
  z.object({
    nombre_completo: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    cedula: z.string().optional().or(z.literal('')),
    fecha_nacimiento: z.string().optional().or(z.literal('')),

    edad: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine(
        (val) => {
          if (!val) return true;
          const num = Number(val);
          return !isNaN(num) && num >= 0 && num <= 120;
        },
        { message: 'La edad debe ser un número entre 0 y 120' }
      ),

    genero: z.enum(['Masculino', 'Femenino']).optional(),
    telefono: z.string().optional().or(z.literal('')),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    seguro_compania: z.string().optional().or(z.literal('')),
    seguro_poliza: z.string().optional().or(z.literal('')),
    contacto_emergencia_nombre: z.string().optional().or(z.literal('')),
    contacto_emergencia_telefono: z.string().optional().or(z.literal('')),
    alergias: z.string().optional().or(z.literal('')),
    antecedentes: z.string().optional().or(z.literal('')),
    tratamiento_actual: z.string().optional().or(z.literal('')),
    ...affiliationFields,
  })
)

type PatientForm = z.infer<typeof patientSchema>

interface EditPatientModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Paciente
}

export default function EditPatientModal({ isOpen, onClose, patient }: EditPatientModalProps) {
  const { updatePatient, isUpdating } = usePatients()

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
  })

  const esAfiliado = watch('es_afiliado')

  // 2. Controlar la carga de datos: Parsear nulos a strings vacíos para el frontend
  useEffect(() => {
    if (patient) {
      reset({
        nombre_completo: patient.nombre_completo,
        cedula: patient.cedula || '',
        fecha_nacimiento: patient.fecha_nacimiento ? new Date(patient.fecha_nacimiento).toISOString().split('T')[0] : '',
        edad: patient.edad !== undefined && patient.edad !== null ? String(patient.edad) : '',
        genero: (patient.genero as PatientForm['genero']) || 'Masculino',
        telefono: patient.telefono || '',
        email: patient.email || '',
        seguro_compania: patient.seguro_compania || '',
        seguro_poliza: patient.seguro_poliza || '',
        contacto_emergencia_nombre: patient.contacto_emergencia_nombre || '',
        contacto_emergencia_telefono: patient.contacto_emergencia_telefono || '',
        alergias: patient.alergias || '',
        antecedentes: patient.antecedentes || '',
        tratamiento_actual: patient.tratamiento_actual || '',
        es_afiliado: patient.es_afiliado ?? false,
        tipo_afiliacion:
          patient.es_afiliado && patient.tipo_afiliacion !== TIPO_AFILIACION_NINGUNA
            ? patient.tipo_afiliacion
            : undefined,
        titular_nombre: patient.titular_nombre ?? '',
      })
    }
  }, [patient, reset])

  if (!isOpen) return null

  // 3. Preparar los datos antes de actualizar
  const onSubmit = (data: PatientForm) => {
    const affiliation = mapAffiliationPayload(data)

    const formattedData: Paciente = {
      ...patient,
      ...data,
      ...affiliation,
      // Manejamos las fechas y la edad transformando de nuevo a sus tipos nativos o null
      fecha_nacimiento: data.fecha_nacimiento && data.fecha_nacimiento !== '' ? new Date(data.fecha_nacimiento).toISOString() : null,
      edad: data.edad && data.edad !== '' ? Number(data.edad) : null,
      titular_nombre: data.es_afiliado ? affiliation.titular_nombre : null,
    }

    updatePatient(formattedData, {
      onSuccess: () => {
        toast.success('Datos del paciente actualizados')
        onClose()
      },
      onError: (error: Error) => {
        toast.error(`Error: ${error.message}`)
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Editar Datos del Paciente
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400 dark:text-slate-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Datos Personales</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                <input {...register('nombre_completo')} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
                {errors.nombre_completo && <p className="text-xs text-red-500 mt-1">{errors.nombre_completo.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cédula / ID</label>
                <input {...register('cedula')} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>

              {/* 4. Campo de Edad reemplazando a Fecha de Nacimiento */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Edad</label>
                <input {...register('edad')} type="number" min="0" max="120" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Ej: 45" />
                {errors.edad && <p className="text-xs text-red-500 mt-1">{errors.edad.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Género</label>
                <select {...register('genero')} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
                <input {...register('telefono')} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                <input {...register('email')} type="email" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>

              <MilitaryAffiliationFields control={control as any} errors={errors} esAfiliado={!!esAfiliado} setValue={setValue} />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Seguro Médico
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Compañía de Seguro</label>
                <input {...register('seguro_compania')} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Ej: OSDE, Swiss Medical..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nº de Póliza</label>
                <input {...register('seguro_poliza')} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="123456789" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Contacto de Emergencia
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre de Contacto</label>
                <input {...register('contacto_emergencia_nombre')} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Nombre completo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono de Emergencia</label>
                <input {...register('contacto_emergencia_telefono')} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="04..." />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" />
              Información Clínica Crítica
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-red-600 dark:text-red-400 mb-1 font-bold">Alergias</label>
                <textarea {...register('alergias')} rows={2} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-red-50/30 dark:bg-red-900/20 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none" placeholder="Ninguna conocida" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Antecedentes Médicos (Personales y Familiares)</label>
                <textarea {...register('antecedentes')} rows={3} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none" placeholder="Registrar antecedentes relevantes..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tratamiento Actual / Medicamentos</label>
                <textarea {...register('tratamiento_actual')} rows={2} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none resize-none" placeholder="Medicamentos que toma actualmente..." />
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-3 border-t border-slate-100 dark:border-slate-700">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={isUpdating} className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-xl hover:cursor-pointer hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2">
              {isUpdating ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : 'Actualizar Ficha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}