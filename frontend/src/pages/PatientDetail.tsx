import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  IdCard, 
  Plus, 
  FileText,
  Clock,
  ChevronRight,
  ClipboardList,
  X,
  Edit2,
  AlertCircle,
  Activity,
  Eye,
  Download,
  Loader2
} from 'lucide-react'
import { usePatientDetail } from '@/hooks/usePatientDetail'
import { useState } from 'react'
import { supabase } from '@/services/supabase'
import { toast } from 'sonner'
import AddHistoryModal from '@/components/history/AddHistoryModal'
import EditHistoryModal from '@/components/history/EditHistoryModal'
import EditPatientModal from '@/components/patients/EditPatientModal'
import ViewPatientModal from '@/components/patients/ViewPatientModal'
import type { HistoriaClinica } from '@/types'

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>()
  const { patient, history, isLoadingPatient, isLoadingHistory } = usePatientDetail(id!)
  const [isAddHistoryOpen, setIsAddHistoryOpen] = useState(false)
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false)
  const [isViewPatientOpen, setIsViewPatientOpen] = useState(false)
  const [editingHistory, setEditingHistory] = useState<HistoriaClinica | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<{ nombre: string, url: string, path: string } | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!selectedDoc) return
    setIsDownloading(true)
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(selectedDoc.path)
      
      if (error) throw error

      const blobUrl = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = selectedDoc.nombre
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch (error: any) {
      toast.error('Error al descargar el archivo')
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoadingPatient) {
    return <div className="p-8 text-center text-slate-500">Cargando datos del paciente...</div>
  }

  if (!patient) {
    return (
      <div className="p-8 text-center space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Paciente no encontrado</h3>
        <Link to="/" className="text-primary hover:underline flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver al panel
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{patient.nombre_completo}</h3>
            <p className="text-slate-500 font-medium text-sm">Ficha Médica Digital</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAddHistoryOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:cursor-pointer hover:bg-primary/90 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nueva Evolución
        </button>
      </div>

      {/* FILA SUPERIOR: Dashboard de Información Crítica */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Resumen del Paciente */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="bg-slate-50 p-6 flex flex-col items-center border-b border-slate-200 flex-1 justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary mb-3 shadow-inner">
              {patient.nombre_completo.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <h4 className="font-bold text-slate-900 text-lg text-center line-clamp-1 px-4">{patient.nombre_completo}</h4>
          </div>
          
          <div className="p-4 grid grid-cols-2 gap-4 border-b border-slate-100 bg-white">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Contacto</p>
              <p className="text-sm font-bold text-slate-700 truncate">{patient.telefono || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Contacto Emergencia</p>
              <p className="text-sm font-bold text-slate-700 truncate">{patient.contacto_emergencia_telefono || '-'}</p>
            </div>
          </div>

          <div className="p-4 bg-white flex gap-2">
            <button
              onClick={() => setIsViewPatientOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-100 text-slate-700 font-bold rounded hover:cursor-pointer hover:bg-slate-200 transition-all text-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              Ver Datos
            </button>
            <button
              onClick={() => setIsEditPatientOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-primary/20 text-primary font-bold rounded-xl hover:cursor-pointer hover:bg-primary/5 transition-all text-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Editar
            </button>
          </div>
        </div>

        {/* Panel 2: Alerta Médica (Alergias / Tratamientos) */}
        <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full flex flex-col">
              <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase text-xs tracking-widest">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Datos Importantes
              </h5>
              <div className="space-y-5 flex-1">
                {(!patient.alergias && !patient.tratamiento_actual) ? (
                  <p className="font-bold text-slate-800 text-sm leading-relaxed">
                    No se han registrado datos importantes para este paciente todavía.
                  </p>
                ) : (
                  <>
                    {patient.alergias && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Alergias</p>
                        <p className="font-bold text-slate-800 text-sm leading-relaxed">{patient.alergias}</p>
                      </div>
                    )}
                    {patient.tratamiento_actual && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Tratamiento Actual</p>
                        <p className="font-bold text-slate-800 text-sm leading-relaxed">{patient.tratamiento_actual}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
        </div>

        {/* Panel 3: Antecedentes Médicos */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full flex flex-col">
            <h5 className="font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase text-xs tracking-widest">
              <Activity className="w-4 h-4 text-orange-500" />
              Antecedentes Médicos
            </h5>
            <div className="flex-1 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
              <p className="font-bold text-slate-800 text-sm leading-relaxed">
                {patient.antecedentes || 'No se han registrado antecedentes relevantes para este paciente todavía.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILA INFERIOR: Historial Clínico (Ancho Completo) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 min-h-[40vh]">
        <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/5 rounded-2xl text-primary border border-primary/10">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900">Historial Clínico Digital</h4>
              <p className="text-slate-500 text-sm font-medium">Línea de tiempo completa de evoluciones y consultas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-4 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
              {history.length} {history.length === 1 ? 'Entrada' : 'Entradas'}
            </span>
          </div>
        </div>

        {isLoadingHistory ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-400 font-medium">Cargando cronología médica...</p>
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {history.map((item) => (
              <div key={item.id} className="relative pl-12 group">
                <div className="absolute left-0 top-1 w-10 h-10 rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center z-10 group-hover:border-primary/30 group-hover:bg-primary/5 transition-all shadow-sm">
                  <Clock className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                
                <div className="bg-white border border-slate-100 rounded-2xl p-6 hover:border-primary/20 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-primary">
                        {new Date(item.fecha_consulta).toLocaleDateString('es-ES', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </p>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {new Date(item.fecha_consulta).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}hs
                      </span>
                    </div>
                    <button 
                      onClick={() => setEditingHistory(item)}
                      className="p-2 text-slate-400 hover:cursor-pointer hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Motivo de Consulta</h5>
                        <p className="text-sm font-bold text-slate-800 leading-relaxed italic border-l-2 border-slate-200 pl-3">"{item.motivo_consulta}"</p>
                      </div>
                      {item.notas_generales && (
                        <div>
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Examen Físico / Notas</h5>
                          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{item.notas_generales}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-primary">Diagnóstico</h5>
                        <p className="text-sm font-bold text-slate-900 bg-primary/5 p-3 rounded-xl border border-primary/10">{item.diagnostico}</p>
                      </div>
                      <div>
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-green-600">Tratamiento / Plan</h5>
                        <p className="text-sm font-bold text-green-700 bg-green-50 p-3 rounded-xl border border-green-100">{item.tratamiento}</p>
                      </div>
                    </div>
                  </div>

                  {item.metadatos?.documentos && (item.metadatos.documentos as any[]).length > 0 && (
                    <div className="mt-6 pt-6 border-t border-slate-50">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Archivos Adjuntos</h5>
                      <div className="flex flex-wrap gap-2">
                        {(item.metadatos.documentos as any[]).map((doc: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedDoc({
                              nombre: doc.nombre,
                              url: supabase.storage.from('documents').getPublicUrl(doc.storage_path).data.publicUrl,
                              path: doc.storage_path
                            })}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:cursor-pointer hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-100 transition-colors text-xs font-medium"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            {doc.nombre}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h5 className="text-lg font-bold text-slate-400">Sin historial médico</h5>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">Comienza registrando la primera evolución clínica del paciente.</p>
          </div>
        )}
      </div>

      {/* Modales */}
      <AddHistoryModal 
        isOpen={isAddHistoryOpen} 
        onClose={() => setIsAddHistoryOpen(false)} 
        patientId={id!} 
      />
      
      <EditHistoryModal 
        isOpen={!!editingHistory}
        onClose={() => setEditingHistory(null)}
        patientId={id!}
        historyItem={editingHistory}
      />

      <EditPatientModal 
        isOpen={isEditPatientOpen}
        onClose={() => setIsEditPatientOpen(false)}
        patient={patient}
      />

      <ViewPatientModal
        isOpen={isViewPatientOpen}
        onClose={() => setIsViewPatientOpen(false)}
        patient={patient}
      />

      {/* Visor de Documentos (Modal) */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedDoc(null)}>
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-slate-900">{selectedDoc.nombre}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:cursor-pointer hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Descargar
                </button>
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 hover:cursor-pointer hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-200 overflow-hidden relative">
              {selectedDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={`${selectedDoc.url}#toolbar=0`} 
                  className="w-full h-full border-none"
                  title="Visor PDF"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8 overflow-auto">
                  <img 
                    src={selectedDoc.url} 
                    alt={selectedDoc.nombre} 
                    className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
