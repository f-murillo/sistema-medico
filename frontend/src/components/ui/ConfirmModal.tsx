import { AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false
}: ConfirmModalProps) {
  
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Dialog */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
        {/* Header Ribbon */}
        <div className={`h-2 w-full ${isDestructive ? 'bg-red-500' : 'bg-primary'}`} />
        
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDestructive ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-primary'
            }`}>
              {isDestructive ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div className="space-y-2 flex-1 pt-1">
              <h3 className="font-bold text-lg text-slate-900 leading-tight">
                {title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {message}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors absolute top-4 right-4 hover:cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 transition-colors hover:cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm transition-all active:scale-95 hover:cursor-pointer ${
                isDestructive 
                  ? 'bg-red-600 hover:bg-red-700 hover:shadow-md' 
                  : 'bg-primary hover:bg-primary/90 hover:shadow-md'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
