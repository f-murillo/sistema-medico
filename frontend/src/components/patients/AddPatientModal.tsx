import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, User, Calendar, Phone, Mail, IdCard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePatients } from '@/hooks/usePatients'
import MilitaryAffiliationFields from '@/components/patients/MilitaryAffiliationFields'
import {
  affiliationFields,
  mapAffiliationPayload,
  withMilitaryAffiliationValidation,
} from '@/lib/patientSchema'

const patientSchema = withMilitaryAffiliationValidation(
  z.object({
    nombre_completo: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    cedula: z.string().min(5, 'Cédula inválida'),
    fecha_nacimiento: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Fecha de nacimiento inválida',
    }),
    genero: z.enum(['Masculino', 'Femenino', 'Otro']),
    telefono: z.string().min(7, 'Teléfono inválido'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    alergias: z.string().optional(),
    antecedentes: z.string().optional(),
    tratamiento_actual: z.string().optional(),
    ...affiliationFields,
  })
)

type PatientForm = z.infer<typeof patientSchema>

interface AddPatientModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddPatientModal({ isOpen, onClose }: AddPatientModalProps) {
  const { createPatient, isCreating } = usePatients()

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      genero: 'Masculino',
      es_afiliado: false,
    },
  })

  const esAfiliado = watch('es_afiliado')

  if (!isOpen) return null

  const onSubmit = (data: PatientForm) => {
    const payload = mapAffiliationPayload({
      ...data,
      fecha_nacimiento: new Date(data.fecha_nacimiento).toISOString(),
    })

    createPatient(payload, {
      onSuccess: () => {
        toast.success('Paciente registrado correctamente')
        reset()
        onClose()
      },
      onError: (error: Error & { response?: { data?: string } }) => {
        const message = error.response?.data ?? error.message
        toast.error(`Error: ${message}`)
      },
    })
  }

  return (
    <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Registrar Nuevo Paciente
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 hover:cursor-pointer rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  {...register('nombre_completo')}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              {errors.nombre_completo && <p className="text-xs text-red-500 mt-1">{errors.nombre_completo.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cédula / ID</label>
              <div className="relative">
                <IdCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  {...register('cedula')}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="12345678"
                />
              </div>
              {errors.cedula && <p className="text-xs text-red-500 mt-1">{errors.cedula.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha de Nacimiento</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  {...register('fecha_nacimiento')}
                  type="date"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              {errors.fecha_nacimiento && <p className="text-xs text-red-500 mt-1">{errors.fecha_nacimiento.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Género</label>
              <select
                {...register('genero')}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  {...register('telefono')}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="+54 11..."
                />
              </div>
              {errors.telefono && <p className="text-xs text-red-500 mt-1">{errors.telefono.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico (Opcional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  {...register('email')}
                  type="email"
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="paciente@correo.com"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <MilitaryAffiliationFields control={control} errors={errors} esAfiliado={!!esAfiliado} />

            <div className="md:col-span-2 space-y-4 pt-2">
              <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Información Clínica Inicial</h4>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alergias</label>
                <textarea
                  {...register('alergias')}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="Ej: Penicilina, polen, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Antecedentes Médicos</label>
                <textarea
                  {...register('antecedentes')}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="Cirugías previas, enfermedades crónicas, antecedentes familiares..."
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex gap-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold rounded-lg hover:cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-4 py-2.5 bg-primary text-white font-semibold rounded-lg hover:cursor-pointer hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Paciente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
