import { X, User, Phone, IdCard, Shield, Heart, Activity, Medal } from 'lucide-react'
import type { Paciente } from '@/types'

interface ViewPatientModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Paciente
}

export default function ViewPatientModal({ isOpen, onClose, patient }: ViewPatientModalProps) {
  if (!isOpen) return null

  const dataSections = [
    {
      title: 'Datos Personales',
      icon: User,
      color: 'text-blue-500 dark:text-blue-400',
      fields: [
        { label: 'Nombre Completo', value: patient.nombre_completo },
        { label: 'Cédula / ID', value: patient.cedula },
        { label: 'Género', value: patient.genero },
        { label: 'Edad', value: patient.edad },
      ]
    },
    {
      title: 'Contacto',
      icon: Phone,
      color: 'text-green-500 dark:text-green-400',
      fields: [
        { label: 'Teléfono', value: patient.telefono },
        { label: 'Correo Electrónico', value: patient.email || 'No registrado' },
      ]
    },
    {
      title: 'Información de Seguro',
      icon: Shield,
      color: 'text-purple-500 dark:text-purple-400',
      fields: [
        { label: 'Compañía', value: patient.seguro_compania || 'Particular' },
        { label: 'Nº Póliza', value: patient.seguro_poliza || 'N/A' },
      ]
    },
    {
      title: 'Emergencia',
      icon: Heart,
      color: 'text-red-500 dark:text-red-400',
      fields: [
        { label: 'Contacto de Emergencia', value: patient.contacto_emergencia_nombre || 'No registrado' },
        { label: 'Teléfono de Emergencia', value: patient.contacto_emergencia_telefono || 'N/A' },
      ]
    },
    ...(patient.es_afiliado
      ? [{
        title: 'Afiliación Militar',
        icon: Medal,
        color: 'text-amber-600 dark:text-amber-400',
        fields: [
          { label: 'Estado', value: 'Afiliado Militar' },
          { label: 'Parentesco', value: patient.tipo_afiliacion },
          { label: 'Titular Militar', value: patient.titular_nombre || 'No registrado' },
        ],
      }]
      : []),
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <IdCard className="w-5 h-5 text-primary" />
            Ficha Completa del Paciente
          </h3>
          <button onClick={onClose} className="p-2 hover:cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400 dark:text-slate-300" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {dataSections.map((section) => (
              <div key={section.title} className="space-y-4">
                <h4 className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${section.color}`}>
                  <section.icon className="w-4 h-4" />
                  {section.title}
                </h4>
                <div className="space-y-3">
                  {section.fields.map((field) => (
                    <div key={field.label}>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">{field.label}</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{field.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              Información Clínica Registrada
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight mb-1">Alergias</p>
                <p className="text-sm font-bold text-red-600 dark:text-red-400">{patient.alergias || 'Ninguna conocida'}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight mb-1">Antecedentes Médicos</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{patient.antecedentes || 'Sin antecedentes registrados'}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight mb-1">Tratamiento Actual</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{patient.tratamiento_actual || 'No reportado'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 dark:bg-slate-600 text-white font-bold rounded-xl hover:cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-500 transition-all shadow-md">
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  )
}
