import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Calendar, Activity, Clock, AlertCircle, UserPlus, Trash2, Search } from 'lucide-react'
import { usePatients } from '@/hooks/usePatients'
import { useAppointments } from '@/hooks/useAppointments'
import AddPatientModal from '@/components/patients/AddPatientModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { toast } from 'sonner'

export default function Dashboard() {
  const { patients, isLoading: isLoadingPatients, isError: isErrorPatients, deletePatient } = usePatients()
  const { appointments, isLoading: isLoadingAppointments, isError: isErrorAppointments } = useAppointments()

  const isLoading = isLoadingPatients || isLoadingAppointments
  const isError = isErrorPatients || isErrorAppointments

  // Calcular fechas de hoy (inicio a las 00:00:00 y fin a las 23:59:59 local)
  const inicioDeHoy = new Date()
  inicioDeHoy.setHours(0, 0, 0, 0)
  const finDeHoy = new Date()
  finDeHoy.setHours(23, 59, 59, 999)

  const nuevosPacientesHoyCount = patients.filter((patient) => {
    const fechaCreacion = new Date(patient.created_at)
    return fechaCreacion >= inicioDeHoy
  }).length

  const citasHoyCount = appointments.filter((cita) => {
    const fechaCita = new Date(cita.fecha_hora)
    return fechaCita >= inicioDeHoy && fechaCita <= finDeHoy
  }).length

  const citasPendientesCount = appointments.filter((cita) => {
    return cita.estado === 'programada'
  }).length

  const [deleteModalData, setDeleteModalData] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' })

  const handleDeletePatientClick = (id: string, name: string) => {
    setDeleteModalData({ isOpen: true, id, name })
  }

  const confirmDeletePatient = () => {
    deletePatient(deleteModalData.id, {
      onSuccess: () => toast.success('Paciente eliminado correctamente'),
      onError: (err: any) => toast.error(`Error: ${err.message}`)
    })
  }
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')

  const filteredPatients = patients.filter(p => {
    const searchTerm = patientSearch.toLowerCase()

    // Extraemos las variables garantizando que siempre sean strings (incluso si son null/undefined)
    const nombre = p.nombre_completo.toLowerCase()
    const email = (p.email ?? '').toLowerCase()
    const telefono = (p.telefono ?? '').toLowerCase()

    return (
      nombre.includes(searchTerm) ||
      email.includes(searchTerm) ||
      telefono.includes(searchTerm)
    )
  })

  const stats = [
    { name: 'Pacientes Totales', value: patients.length.toString(), icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { name: 'Citas Hoy', value: citasHoyCount.toString(), icon: Calendar, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30', link: '/citas?filter=programada' },
    { name: 'Nuevos Pacientes', value: nuevosPacientesHoyCount.toString(), icon: Activity, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
    { name: 'Citas Pendientes', value: citasPendientesCount.toString(), icon: Clock, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30', link: '/citas?filter=programada' },
  ]

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Error al cargar datos</h3>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
          Hubo un problema al conectar con el servidor. Por favor, asegúrate de que el backend esté corriendo en el puerto 8080.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Panel de Resumen</h3>
          <p className="text-slate-500 dark:text-slate-400">Visualiza el estado actual de tus pacientes y agenda.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-semibold rounded-lg hover:cursor-pointer hover:bg-primary/90 transition-all shadow-md active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Paciente
        </button>
      </div>

      <AddPatientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ConfirmModal
        isOpen={deleteModalData.isOpen}
        onClose={() => setDeleteModalData({ isOpen: false, id: '', name: '' })}
        onConfirm={confirmDeletePatient}
        title="Eliminar Paciente"
        message={`¿Estás seguro de que deseas eliminar al paciente ${deleteModalData.name}? Esta acción eliminará permanentemente todos sus datos e historias clínicas asociadas y no se puede deshacer.`}
        confirmText="Eliminar Paciente"
        isDestructive={true}
        requirePassword={true}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const cardContent = (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          )

          if (stat.link) {
            return (
              <Link
                key={stat.name}
                to={stat.link}
                className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in duration-500 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 transition-all hover:cursor-pointer block"
              >
                {cardContent}
              </Link>
            )
          }

          return (
            <div key={stat.name} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in duration-500">
              {cardContent}
            </div>
          )
        })}
      </div>

      {/* Patients Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 shrink-0">Pacientes</h4>
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Paciente</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email / Teléfono</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fecha Registro</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {isLoading ? (
                // Skeletons
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    {patientSearch ? `No se encontraron pacientes con "${patientSearch}".` : 'No hay pacientes registrados todavía.'}
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {patient.nombre_completo.split(' ').map(n => n[0]).join('')}
                        </div>
                        <Link to={`/pacientes/${patient.id}`} className="font-medium text-slate-900 dark:text-slate-100 hover:text-primary transition-colors cursor-pointer">{patient.nombre_completo}</Link>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="text-slate-900 dark:text-slate-100 font-medium">{patient.email}</p>
                        <p className="text-slate-500 dark:text-slate-400">{patient.telefono}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {new Date(patient.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/pacientes/${patient.id}`}
                          className="flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                        >
                          Ver Ficha
                        </Link>
                        <button
                          onClick={() => handleDeletePatientClick(patient.id, patient.nombre_completo)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:cursor-pointer hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                          title="Eliminar Paciente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
