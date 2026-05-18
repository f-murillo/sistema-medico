import { AlertTriangle, CheckCircle2, X, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  requirePassword?: boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
  requirePassword = false
}: ConfirmModalProps) {
  
  const { user } = useAuth()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isVerifying) onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose, isVerifying])

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setPassword('')
      setError('')
      setShowPassword(false)
      setIsVerifying(false)
    }
  }, [isOpen])

  const handleConfirm = async () => {
    if (requirePassword) {
      if (!password) {
        setError('Debes ingresar tu contraseña para continuar.')
        return
      }
      if (!user?.email) return
      
      setIsVerifying(true)
      setError('')
      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: password,
        })
        if (authError) throw authError
        
        onConfirm()
        onClose()
      } catch (err: any) {
        setError('Contraseña incorrecta.')
      } finally {
        setIsVerifying(false)
      }
    } else {
      onConfirm()
      onClose()
    }
  }

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
              disabled={isVerifying}
              className="p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors absolute top-4 right-4 hover:cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {requirePassword && (
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Contraseña actual para confirmar
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (error) setError('')
                  }}
                  disabled={isVerifying}
                  className={`w-full pl-4 pr-10 py-2.5 bg-slate-50 border rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/20 ${
                    error ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-primary'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && <p className="text-red-500 text-xs font-medium mt-1.5">{error}</p>}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isVerifying}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 transition-colors hover:cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isVerifying}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 min-w-[120px] ${
                isDestructive 
                  ? 'bg-red-600 hover:bg-red-700 hover:shadow-md' 
                  : 'bg-primary hover:bg-primary/90 hover:shadow-md'
              } ${isVerifying ? 'opacity-80 pointer-events-none' : 'hover:cursor-pointer'}`}
            >
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
