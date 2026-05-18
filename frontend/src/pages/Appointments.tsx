import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  Calendar, Clock, AlertCircle, 
  CheckCircle2, XCircle, Plus, Search, Filter, 
  Trash2, Edit, ArrowLeft, CheckSquare, Undo2
} from 'lucide-react'
import { useAppointments } from '@/hooks/useAppointments'
import { usePatients } from '@/hooks/usePatients'
import { toast } from 'sonner'
import AddHistoryModal from '@/components/history/AddHistoryModal'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function Appointments() {
  const { 
    appointments, 
    isLoading: isLoadingAppointments, 
    createAppointment, 
    updateAppointment, 
    deleteAppointment 
  } = useAppointments()

  const { patients } = usePatients()

  // State
  const [searchParams] = useSearchParams()
  const initialFilter = searchParams.get('filter') || 'todos'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null)

  // Clinical History integration state
  const [selectedPatientIdForHistory, setSelectedPatientIdForHistory] = useState<string | null>(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyModalData, setHistoryModalData] = useState<{ isOpen: boolean; patientId: string }>({ isOpen: false, patientId: '' })
  const [deleteModalData, setDeleteModalData] = useState<{ isOpen: boolean; id: string; patientName: string }>({ isOpen: false, id: '', patientName: '' })

  // Form states for adding appointment
  const [newPacienteId, setNewPacienteId] = useState('')
  const [newFechaHora, setNewFechaHora] = useState('')
  const [newDuracion, setNewDuracion] = useState(30)
  const [newNotas, setNewNotas] = useState('')

  // Form states for editing appointment
  const [editPacienteId, setEditPacienteId] = useState('')
  const [editFechaHora, setEditFechaHora] = useState('')
  const [editDuracion, setEditDuracion] = useState(30)
  const [editEstado, setEditEstado] = useState<'programada' | 'completada' | 'cancelada' | 'ausente'>('programada')
  const [editNotas, setEditNotas] = useState('')

  // Helper: date inputs formatting
  const toLocalDatetimeInput = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Stats calculation
  const totalCount = appointments.length
  const pendingCount = appointments.filter(a => a.estado === 'programada').length
  const completedCount = appointments.filter(a => a.estado === 'completada').length
  const cancelledCount = appointments.filter(a => a.estado === 'cancelada').length

  // Filtered Appointments
  const filteredAppointments = appointments.filter(appointment => {
    const patientName = appointment.paciente_nombre?.toLowerCase() || ''
    const matchesSearch = patientName.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || appointment.estado === statusFilter
    return matchesSearch && matchesStatus
  })

  // CRUD handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPacienteId || !newFechaHora) {
      toast.error('Por favor, selecciona un paciente y define una fecha/hora.')
      return
    }

    createAppointment({
      paciente_id: newPacienteId,
      fecha_hora: new Date(newFechaHora).toISOString(),
      duracion_minutos: Number(newDuracion),
      estado: 'programada',
      notas: newNotas
    }, {
      onSuccess: () => {
        toast.success('Cita agendada correctamente')
        setIsAddModalOpen(false)
        // Reset
        setNewPacienteId('')
        setNewFechaHora('')
        setNewDuracion(30)
        setNewNotas('')
      },
      onError: (err: any) => {
        toast.error(`Error al agendar cita: ${err.message}`)
      }
    })
  }

  const handleEditOpen = (appointment: any) => {
    setEditingAppointment(appointment)
    setEditPacienteId(appointment.paciente_id)
    setEditFechaHora(toLocalDatetimeInput(appointment.fecha_hora))
    setEditDuracion(appointment.duracion_minutos)
    setEditEstado(appointment.estado)
    setEditNotas(appointment.notas)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editPacienteId || !editFechaHora) {
      toast.error('Campos obligatorios incompletos.')
      return
    }

    const wasAlreadyCompleted = editingAppointment.estado === 'completada'
    const isNowCompleted = editEstado === 'completada'

    updateAppointment({
      id: editingAppointment.id,
      paciente_id: editPacienteId,
      fecha_hora: new Date(editFechaHora).toISOString(),
      duracion_minutos: Number(editDuracion),
      estado: editEstado,
      notas: editNotas
    }, {
      onSuccess: () => {
        toast.success('Cita actualizada correctamente')
        setEditingAppointment(null)

        // Special workflow: if changed to completed, ask to fill Clinical History
        if (isNowCompleted && !wasAlreadyCompleted) {
          setTimeout(() => {
            setHistoryModalData({ isOpen: true, patientId: editPacienteId })
          }, 400)
        }
      },
      onError: (err: any) => {
        toast.error(`Error al actualizar cita: ${err.message}`)
      }
    })
  }

  const handleQuickComplete = (appointment: any) => {
    updateAppointment({
      id: appointment.id,
      paciente_id: appointment.paciente_id,
      fecha_hora: appointment.fecha_hora,
      duracion_minutos: appointment.duracion_minutos,
      estado: 'completada',
      notas: appointment.notas
    }, {
      onSuccess: () => {
        toast.success('Cita completada correctamente')
        setTimeout(() => {
          setHistoryModalData({ isOpen: true, patientId: appointment.paciente_id })
        }, 400)
      },
      onError: (err: any) => {
        toast.error(`Error al completar la cita: ${err.message}`)
      }
    })
  }

  const handleQuickStatusChange = (appointment: any, newStatus: 'programada' | 'completada' | 'cancelada' | 'ausente') => {
    const statusLabels: Record<string, string> = {
      programada: 'reprogramada correctamente',
      completada: 'completada correctamente',
      cancelada: 'cancelada correctamente',
      ausente: 'marcada como ausente'
    }

    updateAppointment({
      id: appointment.id,
      paciente_id: appointment.paciente_id,
      fecha_hora: appointment.fecha_hora,
      duracion_minutos: appointment.duracion_minutos,
      estado: newStatus,
      notas: appointment.notas
    }, {
      onSuccess: () => {
        toast.success(`Cita ${statusLabels[newStatus]}`)
      },
      onError: (err: any) => {
        toast.error(`Error al actualizar estado: ${err.message}`)
      }
    })
  }

  const handleDeleteClick = (id: string, patientName: string) => {
    setDeleteModalData({ isOpen: true, id, patientName })
  }

  const confirmDeleteAppointment = () => {
    deleteAppointment(deleteModalData.id, {
      onSuccess: () => {
        toast.success('Cita eliminada correctamente')
      },
      onError: (err: any) => {
        toast.error(`Error al eliminar cita: ${err.message}`)
      }
    })
  }

  // Render Status Badge helper
  const renderStatusBadge = (estado: string) => {
    switch (estado) {
      case 'programada':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800 uppercase tracking-wide">
            <Clock className="w-3.5 h-3.5" /> Programada
          </span>
        )
      case 'completada':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 uppercase tracking-wide">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completada
          </span>
        )
      case 'cancelada':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800 uppercase tracking-wide">
            <XCircle className="w-3.5 h-3.5" /> Cancelada
          </span>
        )
      case 'ausente':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800 uppercase tracking-wide">
            <AlertCircle className="w-3.5 h-3.5" /> Ausente
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hover:cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Agenda de Citas</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Gestiona tu agenda médica y haz un seguimiento oportuno</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:cursor-pointer hover:bg-primary/90 transition-all shadow-md active:scale-95 text-sm sm:text-base self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" /> Agendar Nueva Cita
        </button>
      </div>

      <ConfirmModal
        isOpen={deleteModalData.isOpen}
        onClose={() => setDeleteModalData({ isOpen: false, id: '', patientName: '' })}
        onConfirm={confirmDeleteAppointment}
        title="Eliminar Cita"
        message={`¿Estás seguro de que deseas eliminar la cita del paciente ${deleteModalData.patientName}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar Cita"
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={historyModalData.isOpen}
        onClose={() => setHistoryModalData({ isOpen: false, patientId: '' })}
        onConfirm={() => {
          setSelectedPatientIdForHistory(historyModalData.patientId)
          setIsHistoryModalOpen(true)
        }}
        title="Cita Completada"
        message="La cita ha sido marcada como COMPLETADA. ¿Deseas ingresar una nueva evolución o historia médica para este paciente en este momento?"
        confirmText="Sí, Crear Historia"
        cancelText="No, en otro momento"
        isDestructive={false}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Citas Totales</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{totalCount}</h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Programadas */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Programadas</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{pendingCount}</h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Completadas */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Completadas</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{completedCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Canceladas */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Canceladas / Ausentes</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{cancelledCount}</h3>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Agenda Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        
        {/* Filters Panel */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80 flex flex-col md:flex-row md:items-center gap-4">
          {/* Search bar */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por paciente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
            />
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1 border border-slate-200/50 dark:border-slate-600">
              {['todos', 'programada', 'completada', 'cancelada', 'ausente'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3.5 py-1.5 text-xs font-bold uppercase rounded-md tracking-wider transition-all hover:cursor-pointer ${
                    statusFilter === status 
                      ? 'bg-white dark:bg-slate-600 text-primary dark:text-blue-300 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {status === 'todos' ? 'Todos' : status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {isLoadingAppointments ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
              <Clock className="w-10 h-10 animate-spin text-primary mx-auto" />
              <p className="font-bold">Cargando agenda médica...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-bold text-slate-600 dark:text-slate-300">No se encontraron citas agendadas</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                No hay registros que coincidan con la búsqueda o todavía no tienes citas programadas.
              </p>
            </div>
          ) : (
            filteredAppointments.map((cita) => {
              const citaDate = new Date(cita.fecha_hora)
              const formattedDate = citaDate.toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })
              const formattedTime = citaDate.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })

              return (
                <div key={cita.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                  {/* Patient & Date Detail */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shadow-sm mt-0.5 animate-pulse-subtle">
                      {cita.paciente_nombre?.split(' ').map(n => n[0]).join('') || 'P'}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link 
                          to={`/pacientes/${cita.paciente_id}`} 
                          className="font-bold text-slate-900 dark:text-slate-100 hover:text-primary transition-colors cursor-pointer text-base"
                          title="Ver Ficha Médica"
                        >
                          {cita.paciente_nombre}
                        </Link>
                        {renderStatusBadge(cita.estado)}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {formattedDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {formattedTime} ({cita.duracion_minutos} min)
                        </span>
                      </div>

                      {cita.notas && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-700/80 max-w-2xl mt-2 italic">
                          "{cita.notas}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex flex-wrap items-center gap-2 self-end md:self-auto border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto justify-end">
                    {cita.estado === 'programada' && (
                      <>
                        <button
                          onClick={() => handleQuickComplete(cita)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:cursor-pointer text-xs font-bold rounded-lg border border-emerald-100 dark:border-emerald-800 transition-all shadow-sm"
                          title="Marcar como Completada"
                        >
                          <CheckSquare className="w-3.5 h-3.5" /> Completar
                        </button>
                        <button
                          onClick={() => handleQuickStatusChange(cita, 'cancelada')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:cursor-pointer text-xs font-bold rounded-lg border border-rose-100 dark:border-rose-800 transition-all shadow-sm"
                          title="Cancelar Cita"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancelar
                        </button>
                        <button
                          onClick={() => handleQuickStatusChange(cita, 'ausente')}
                          className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 hover:cursor-pointer text-xs font-bold rounded-lg border border-amber-100 dark:border-amber-800 transition-all shadow-sm"
                          title="Marcar como Ausente"
                        >
                          <AlertCircle className="w-3.5 h-3.5" /> Ausente
                        </button>
                      </>
                    )}

                    {(cita.estado === 'cancelada' || cita.estado === 'ausente') && (
                      <button
                        onClick={() => handleQuickStatusChange(cita, 'programada')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 hover:cursor-pointer text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600 transition-all shadow-sm"
                        title="Deshacer y marcar como Programada"
                      >
                        <Undo2 className="w-3.5 h-3.5" /> Deshacer
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleEditOpen(cita)}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 hover:cursor-pointer rounded-lg transition-colors"
                      title="Editar Cita"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteClick(cita.id, cita.paciente_nombre || 'Paciente')}
                      className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:cursor-pointer rounded-lg transition-colors"
                      title="Eliminar Cita"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: AGENDAR NUEVA CITA */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Agendar Cita Médica
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-4 overflow-y-auto">
              {/* Paciente selection dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Paciente *
                </label>
                <select
                  required
                  value={newPacienteId}
                  onChange={(e) => setNewPacienteId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-800 dark:text-slate-200"
                >
                  <option value="" className="dark:bg-slate-800">Seleccione un paciente...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id} className="dark:bg-slate-800">{p.nombre_completo}</option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Fecha y Hora *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newFechaHora}
                  onChange={(e) => setNewFechaHora(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Duracion */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Duración (Minutos) *
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  step={5}
                  value={newDuracion}
                  onChange={(e) => setNewDuracion(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Notas / Observaciones
                </label>
                <textarea
                  value={newNotas}
                  onChange={(e) => setNewNotas(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none font-medium text-slate-800 dark:text-slate-200"
                  placeholder="Detalles sobre el motivo de la cita, chequeo, etc..."
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-xl cursor-pointer hover:bg-primary/90 transition-all shadow-md text-sm"
                >
                  Agendar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDITAR / ACTUALIZAR CITA */}
      {/* ============================================================== */}
      {editingAppointment && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setEditingAppointment(null)}
        >
          <div 
            className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Modificar Cita Médica
              </h3>
              <button 
                onClick={() => setEditingAppointment(null)}
                className="p-1.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 overflow-y-auto">
              {/* Paciente selection dropdown (puedes cambiarlo o dejarlo readonly para evitar confusiones) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Paciente
                </label>
                <select
                  required
                  value={editPacienteId}
                  onChange={(e) => setNewPacienteId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-800 dark:text-slate-200 cursor-not-allowed"
                  disabled
                >
                  <option value="" className="dark:bg-slate-800">Seleccione un paciente...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id} className="dark:bg-slate-800">{p.nombre_completo}</option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Fecha y Hora *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={editFechaHora}
                  onChange={(e) => setEditFechaHora(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Duracion */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Duración (Minutos) *
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  step={5}
                  value={editDuracion}
                  onChange={(e) => setEditDuracion(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Estado de la Cita *
                </label>
                <select
                  required
                  value={editEstado}
                  onChange={(e) => setEditEstado(e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-800 dark:text-slate-200"
                >
                  <option value="programada" className="dark:bg-slate-800">Programada</option>
                  <option value="completada" className="dark:bg-slate-800">Completada</option>
                  <option value="cancelada" className="dark:bg-slate-800">Cancelada</option>
                  <option value="ausente" className="dark:bg-slate-800">Ausente</option>
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Notas / Observaciones
                </label>
                <textarea
                  value={editNotas}
                  onChange={(e) => setEditNotas(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none font-medium text-slate-800 dark:text-slate-200"
                  placeholder="Detalles adicionales..."
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-bold rounded-xl cursor-pointer hover:bg-primary/90 transition-all shadow-md text-sm"
                >
                  Actualizar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CONDITIONAL COMPONENT: REGISTRO DE EVOLUCIÓN (INTEGRACIÓN) */}
      {/* ============================================================== */}
      {selectedPatientIdForHistory && (
        <AddHistoryModal
          patientId={selectedPatientIdForHistory}
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false)
            setSelectedPatientIdForHistory(null)
          }}
        />
      )}
    </div>
  )
}
