import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { X, ClipboardList, Stethoscope, Activity, Upload, Loader2, FileIcon, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePatientDetail } from '@/hooks/usePatientDetail'
import { supabase } from '@/services/supabase'

const historySchema = z.object({
  motivo_consulta: z.string().min(10, 'El motivo debe ser más descriptivo'),
  diagnostico: z.string().min(5, 'Diagnóstico requerido'),
  tratamiento: z.string().min(5, 'Tratamiento requerido'),
  notas_generales: z.string().optional(),
})

type HistoryForm = z.infer<typeof historySchema>

interface AddHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
}

export default function AddHistoryModal({ isOpen, onClose, patientId }: AddHistoryModalProps) {
  const { createHistory, isCreatingHistory } = usePatientDetail(patientId)
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<HistoryForm>({
    resolver: zodResolver(historySchema),
  })

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: HistoryForm) => {
    setIsUploading(true)
    const storagePaths: string[] = []

    try {
      // 1. Subir archivos a Supabase Storage (Bucket 'documents')
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${patientId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file)

        if (uploadError) throw uploadError
        storagePaths.push(uploadData.path)
      }

      // 2. Crear Historia Clínica en el Backend
      createHistory({
        history: {
          ...data,
          paciente_id: patientId,
        },
        storagePaths
      }, {
        onSuccess: () => {
          toast.success('Evolución registrada correctamente')
          reset()
          setFiles([])
          onClose()
        },
        onError: (error: any) => {
          toast.error(`Error: ${error.message}`)
        }
      })
    } catch (error: any) {
      toast.error(`Error al subir archivos: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Nueva Evolución Médica
          </h3>
          <button 
            onClick={onClose}
            className="p-2 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400 dark:text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            {/* Motivo de Consulta */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Motivo de Consulta
              </label>
              <textarea
                {...register('motivo_consulta')}
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder-slate-400 dark:placeholder-slate-500"
                placeholder="Describa el motivo de la visita y síntomas actuales..."
              />
              {errors.motivo_consulta && <p className="text-xs text-red-500 mt-1">{errors.motivo_consulta.message}</p>}
            </div>

            {/* Diagnóstico */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-primary" />
                Diagnóstico Presuntivo / Definitivo
              </label>
              <textarea
                {...register('diagnostico')}
                rows={2}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder-slate-400 dark:placeholder-slate-500"
                placeholder="Indique los hallazgos y diagnóstico..."
              />
              {errors.diagnostico && <p className="text-xs text-red-500 mt-1">{errors.diagnostico.message}</p>}
            </div>

            {/* Tratamiento */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                Plan de Tratamiento / Receta
              </label>
              <textarea
                {...register('tratamiento')}
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder-slate-400 dark:placeholder-slate-500"
                placeholder="Indique medicamentos, dosis e instrucciones..."
              />
              {errors.tratamiento && <p className="text-xs text-red-500 mt-1">{errors.tratamiento.message}</p>}
            </div>

            {/* Notas Generales / Examen Físico */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Notas Adicionales / Examen Físico</label>
              <textarea
                {...register('notas_generales')}
                rows={2}
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none placeholder-slate-400 dark:placeholder-slate-500"
                placeholder="Hallazgos del examen físico, signos vitales, etc."
              />
            </div>

            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Documentos Adjuntos (Estudios, Radiografías)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 dark:border-slate-700 border-dashed rounded-xl hover:border-primary/50 transition-colors bg-slate-50/50 dark:bg-slate-800/50">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
                  <div className="flex justify-center text-sm text-slate-600 dark:text-slate-400">
                    <label className="relative cursor-pointer rounded-md font-bold text-primary hover:text-primary/80 transition-colors">
                      <span>Subir archivos</span>
                      <input type="file" multiple className="sr-only" onChange={handleFileUpload} />
                    </label>
                    <p className="pl-1">o arrastrar y soltar</p>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500">PDF, PNG, JPG hasta 10MB</p>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 truncate">
                        <FileIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 cursor-pointer hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreatingHistory || isUploading}
              className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-xl cursor-pointer hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2"
            >
              {isCreatingHistory || isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Finalizar Evolución'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
