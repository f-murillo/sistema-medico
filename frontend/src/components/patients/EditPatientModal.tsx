import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, User, Calendar, Phone, Mail, IdCard, Loader2, Shield, Heart, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { usePatients } from '@/hooks/usePatients'
import type { Paciente } from '@/types'

const patientSchema = z.object({
  nombre_completo: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  cedula: z.string().min(5, 'Cédula inválida'),
  fecha_nacimiento: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Fecha de nacimiento inválida',
  }),
  genero: z.enum(['Masculino', 'Femenino', 'Otro']),
  telefono: z.string().min(7, 'Teléfono inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  seguro_compania: z.string().optional(),
  seguro_poliza: z.string().optional(),
  contacto_emergencia_nombre: z.string().optional(),
  contacto_emergencia_telefono: z.string().optional(),
  alergias: z.string().optional(),
  antecedentes: z.string().optional(),
  tratamiento_actual: z.string().optional(),
})

type PatientForm = z.infer<typeof patientSchema>

interface EditPatientModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Paciente
}

export default function EditPatientModal({ isOpen, onClose, patient }: EditPatientModalProps) {
  const { updatePatient, isUpdating } = usePatients()
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
  })

  useEffect(() => {
    if (patient) {
      reset({
        nombre_completo: patient.nombre_completo,
        cedula: patient.cedula,
        fecha_nacimiento: new Date(patient.fecha_nacimiento).toISOString().split('T')[0],
        genero: patient.genero as any,
        telefono: patient.telefono,
        email: patient.email,
        seguro_compania: patient.seguro_compania,
        seguro_poliza: patient.seguro_poliza,
        contacto_emergencia_nombre: patient.contacto_emergencia_nombre,
        contacto_emergencia_telefono: patient.contacto_emergencia_telefono,
        alergias: patient.alergias,
        antecedentes: patient.antecedentes,
        tratamiento_actual: patient.tratamiento_actual,
      })
    }
  }, [patient, reset])

  if (!isOpen) return null

  const onSubmit = (data: PatientForm) => {
    const formattedData = {
      ...patient,
      ...data,
      fecha_nacimiento: new Date(data.fecha_nacimiento).toISOString(),
    }

    updatePatient(formattedData, {
      onSuccess: () => {
        toast.success('Datos del paciente actualizados')
        onClose()
      },
      onError: (error: any) => {
        toast.error(`Error: ${error.message}`)
      }
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
          {/* Datos Personales */}
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

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha de Nacimiento</label>
                <input {...register('fecha_nacimiento')} type="date" className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Género</label>
                <select {...register('genero')} className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none">
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
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
            </div>
          </div>

          {/* Seguro Médico */}
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

          {/* Contacto de Emergencia */}
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

          {/* Información Clínica */}
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
