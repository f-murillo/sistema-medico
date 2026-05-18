import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, ClipboardList, Stethoscope, Activity, Loader2, Upload, FileIcon, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePatientDetail } from '@/hooks/usePatientDetail'
import { supabase } from '@/services/supabase'
import type { HistoriaClinica } from '@/types'

const historySchema = z.object({
  motivo_consulta: z.string().min(10, 'El motivo debe ser más descriptivo'),
  diagnostico: z.string().min(5, 'Diagnóstico requerido'),
  tratamiento: z.string().min(5, 'Tratamiento requerido'),
  notas_generales: z.string().optional(),
})

type HistoryForm = z.infer<typeof historySchema>

interface EditHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  historyItem: HistoriaClinica | null
}

export default function EditHistoryModal({ isOpen, onClose, patientId, historyItem }: EditHistoryModalProps) {
  const { updateHistory, isUpdatingHistory } = usePatientDetail(patientId)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [existingDocs, setExistingDocs] = useState<any[]>([])
  const [deletedPaths, setDeletedPaths] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<HistoryForm>({
    resolver: zodResolver(historySchema),
  })

  useEffect(() => {
    if (historyItem) {
      reset({
        motivo_consulta: historyItem.motivo_consulta,
        diagnostico: historyItem.diagnostico,
        tratamiento: historyItem.tratamiento,
        notas_generales: historyItem.notas_generales,
      })
      setExistingDocs(historyItem.metadatos?.documentos || [])
      setDeletedPaths([])
      setNewFiles([])
    }
  }, [historyItem, reset])

  if (!isOpen || !historyItem) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index))
  }

  const markForDeletion = (doc: any) => {
    setDeletedPaths(prev => [...prev, doc.storage_path])
    setExistingDocs(prev => prev.filter(d => d.storage_path !== doc.storage_path))
  }

  const onSubmit = async (data: HistoryForm) => {
    setIsUploading(true)
    const storagePaths: string[] = []

    try {
      // 1. Subir nuevos archivos
      for (const file of newFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${patientId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file)

        if (uploadError) throw uploadError
        storagePaths.push(uploadData.path)
      }

      // 2. Actualizar en el Backend
      updateHistory({
        history: {
          ...historyItem,
          ...data,
        },
        storagePaths,
        deletedPaths
      }, {
        onSuccess: () => {
          toast.success('Evolución actualizada correctamente')
          onClose()
        },
        onError: (error: any) => {
          toast.error(`Error: ${error.message}`)
        }
      })
    } catch (error: any) {
      toast.error(`Error al procesar archivos: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Editar Evolución Médica
          </h3>
          <button 
            onClick={onClose}
            className="p-2 cursor-pointer hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Motivo de Consulta
              </label>
              <textarea
                {...register('motivo_consulta')}
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              />
              {errors.motivo_consulta && <p className="text-xs text-red-500 mt-1">{errors.motivo_consulta.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                Diagnóstico
              </label>
              <textarea
                {...register('diagnostico')}
                rows={2}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              />
              {errors.diagnostico && <p className="text-xs text-red-500 mt-1">{errors.diagnostico.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                Tratamiento / Plan
              </label>
              <textarea
                {...register('tratamiento')}
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              />
              {errors.tratamiento && <p className="text-xs text-red-500 mt-1">{errors.tratamiento.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Notas Adicionales / Examen Físico</label>
              <textarea
                {...register('notas_generales')}
                rows={2}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              />
            </div>

            {/* Gestión de Documentos */}
            <div className="space-y-4 pt-4">
              <label className="block text-sm font-bold text-slate-700 mb-1">Gestión de Documentos</label>
              
              {/* Documentos Existentes */}
              {existingDocs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400 font-bold uppercase">Archivos actuales</p>
                  <ul className="space-y-2">
                    {existingDocs.map((doc, i) => (
                      <li key={i} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <FileIcon className="w-4 h-4" />
                          <span className="truncate">{doc.nombre}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => markForDeletion(doc)}
                          className="p-1 text-slate-400 cursor-pointer hover:text-red-500 transition-colors"
                          title="Eliminar archivo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Subir Nuevos */}
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-xl hover:border-primary/50 transition-colors bg-slate-50/50">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="flex text-sm text-slate-600">
                    <label className="relative cursor-pointer rounded-md font-bold text-primary hover:text-primary/80 transition-colors">
                      <span>Añadir nuevos archivos</span>
                      <input type="file" multiple className="sr-only" onChange={handleFileUpload} />
                    </label>
                  </div>
                  <p className="text-xs text-slate-400">PDF, PNG, JPG hasta 10MB</p>
                </div>
              </div>

              {/* Lista de Nuevos */}
              {newFiles.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {newFiles.map((file, i) => (
                    <li key={i} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-100 rounded-lg text-sm">
                      <div className="flex items-center gap-2 text-blue-700">
                        <FileIcon className="w-4 h-4" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-[10px] bg-blue-200 px-1.5 rounded uppercase font-bold">Nuevo</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeNewFile(i)}
                        className="p-1 text-blue-400 cursor-pointer hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUpdatingHistory || isUploading}
              className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-xl cursor-pointer hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isUpdatingHistory || isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
