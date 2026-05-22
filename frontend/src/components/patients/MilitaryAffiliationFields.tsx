import { useEffect, type ReactNode } from 'react'
import { Controller, useWatch, type Control, type FieldErrors, type FieldValues, type UseFormSetValue } from 'react-hook-form'
import { Medal, User } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { TIPOS_AFILIACION_FAMILIAR } from '@/lib/patientSchema'

interface MilitaryAffiliationFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any> | Control<FieldValues>
  errors: FieldErrors
  esAfiliado: boolean
  setValue: UseFormSetValue<any> // <-- Agregamos setValue para poder forzar el valor en el formulario
}

function AnimatedCollapse({
  show,
  className,
  children,
}: {
  show: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={`grid transition-all duration-300 ease-in-out ${show ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        } ${className ?? ''}`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}

export default function MilitaryAffiliationFields({
  control,
  errors,
  esAfiliado,
  setValue, // <-- Lo recibimos aquí
}: MilitaryAffiliationFieldsProps) {

  // Observamos tanto el tipo de afiliación como el nombre completo del paciente en tiempo real
  const tipoAfiliacion = useWatch({ control, name: 'tipo_afiliacion' })
  const nombreCompletoPaciente = useWatch({ control, name: 'nombre_completo' })

  const esElPropioTitular = tipoAfiliacion === 'Titular'

  // EFECTO DE SINCRONIZACIÓN AUTOMÁTICA
  useEffect(() => {
    if (esElPropioTitular) {
      // Si es el titular, copiamos automáticamente el nombre completo del paciente en tiempo real
      setValue('titular_nombre', nombreCompletoPaciente || '')
    }
  }, [esElPropioTitular, nombreCompletoPaciente, setValue])

  return (
    <div className="md:col-span-2 space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700">
      <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
        <Medal className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        Afiliación Militar
      </h4>

      <Controller
        name="es_afiliado"
        control={control}
        render={({ field }) => (
          <label className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-700/40 cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                ¿Es Afiliado Militar?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Familiar de personal militar en servicio activo o retirado
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={field.value}
              onClick={() => field.onChange(!field.value)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${field.value ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${field.value ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </label>
        )}
      />

      <AnimatedCollapse show={esAfiliado} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Parentesco con el Titular
          </label>
          <Controller
            name="tipo_afiliacion"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder="Seleccione parentesco..."
              >
                {TIPOS_AFILIACION_FAMILIAR.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </Select>
            )}
          />
          {errors.tipo_afiliacion && (
            <p className="text-xs text-red-500 mt-1">{String(errors.tipo_afiliacion.message)}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Nombre Completo del Militar Titular
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Controller
              name="titular_nombre"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  value={field.value ?? ''}
                  disabled={esElPropioTitular}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg outline-none transition-all ${esElPropioTitular
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed font-medium'
                      : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder-slate-400 dark:placeholder-slate-500'
                    }`}
                  placeholder={esElPropioTitular ? 'El paciente es el titular' : 'Ej: Cap. Juan Rodríguez'}
                />
              )}
            />
          </div>
          {errors.titular_nombre && !esElPropioTitular && (
            <p className="text-xs text-red-500 mt-1">{String(errors.titular_nombre.message)}</p>
          )}
        </div>
      </AnimatedCollapse>
    </div>
  )
}