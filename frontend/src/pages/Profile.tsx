import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { doctorService } from '@/services/doctorService'
import type { Medico } from '@/services/doctorService'
import { User, Save, Loader2, ArrowLeft, Lock, Mail, KeyRound, Eye, EyeOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/services/supabase'

const profileSchema = z.object({
  nombre_completo: z.string().min(3, 'El nombre es demasiado corto'),
  especialidad: z.string().min(3, 'La especialidad es requerida'),
  cedula_profesional: z.string().min(5, 'La cédula profesional es requerida'),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function Profile() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  // States for credentials
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Toggle password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: () => doctorService.getProfile()
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Medico>) => doctorService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-profile'] })
      toast.success('Perfil actualizado correctamente')
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`)
    }
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    if (profile) {
      reset({
        nombre_completo: profile.nombre_completo,
        especialidad: profile.especialidad,
        cedula_profesional: profile.cedula_profesional,
      })
    }
  }, [profile, reset])

  const onSubmit = (data: ProfileForm) => {
    updateMutation.mutate(data)
  }

  // Handle email update via Supabase
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) {
      toast.error('El nuevo correo electrónico no puede estar vacío.')
      return
    }
    setEmailLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
      if (error) throw error
      toast.success('¡Enlace enviado! Revisa tu bandeja de entrada en el nuevo correo para confirmar el cambio.')
      setNewEmail('')
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar el correo electrónico')
    } finally {
      setEmailLoading(false)
    }
  }

  // Handle password update via Supabase (Requires current password verification)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword.trim()) {
      toast.error('Debes ingresar tu contraseña actual por motivos de seguridad.')
      return
    }
    if (!newPassword.trim()) {
      toast.error('La nueva contraseña no puede estar vacía.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden.')
      return
    }
    
    setPasswordLoading(true)
    try {
      // 1. Re-autenticar al médico con su contraseña actual
      if (!user?.email) throw new Error('No se pudo identificar el correo de tu sesión.')
      
      const { error: reAuthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      })

      if (reAuthError) {
        throw new Error('La contraseña actual ingresada es incorrecta.')
      }

      // 2. Si es exitoso, cambiar la contraseña
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      
      toast.success('¡Contraseña actualizada correctamente!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar la contraseña')
    } finally {
      setPasswordLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const initials = profile?.nombre_completo
    ?.split(' ')
    ?.map((n) => n[0])
    ?.join('')
    ?.toUpperCase()
    ?.slice(0, 2) || 'M'

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hover:cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Mi Perfil Profesional</h2>
            <p className="text-slate-500 dark:text-slate-400">Gestiona tu información pública y credenciales médicas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card de Visualización */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden text-center p-8 sticky top-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary mx-auto mb-4 shadow-inner">
              {initials}
            </div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 line-clamp-2">{profile?.nombre_completo}</h3>
            <p className="text-primary dark:text-blue-400 font-medium text-sm mt-1">{profile?.especialidad || 'Especialidad no definida'}</p>
          </div>
        </div>

        {/* Formularios de Edición e Inicio de Sesión */}
        <div className="md:col-span-2 space-y-8">
          {/* Card 1: Datos Profesionales */}
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Datos Profesionales
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tu información básica pública expuesta a los pacientes</p>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                  Nombre Completo
                </label>
                <input
                  {...register('nombre_completo')}
                  type="text"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200"
                  placeholder="Dr. Nombre Apellido"
                />
                {errors.nombre_completo && <p className="text-xs text-red-500 mt-1">{errors.nombre_completo.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                  Especialidad Médica
                </label>
                <input
                  {...register('especialidad')}
                  type="text"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200"
                  placeholder="Ej: Cardiología, Pediatría, etc."
                />
                {errors.especialidad && <p className="text-xs text-red-500 mt-1">{errors.especialidad.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                  Cédula Profesional / ID Médico
                </label>
                <input
                  {...register('cedula_profesional')}
                  type="text"
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200"
                  placeholder="Nº de Cédula o Registro Profesional"
                />
                {errors.cedula_profesional && <p className="text-xs text-red-500 mt-1">{errors.cedula_profesional.message}</p>}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50 hover:cursor-pointer"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Datos
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Card 2: Credenciales de Acceso */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Credenciales de Acceso
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Gestiona tu correo de ingreso y actualiza tu contraseña de seguridad</p>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700 space-y-8">
              {/* Sección 1: Cambiar Correo */}
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Mail className="w-4.5 h-4.5 text-primary" />
                  Cambiar Correo Electrónico
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                      Correo Actual
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                      Nuevo Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200"
                      placeholder="nuevo@correo.com"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50 hover:cursor-pointer"
                  >
                    {emailLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Actualizando Correo...
                      </>
                    ) : (
                      <>
                        Actualizar Correo
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Sección 2: Cambiar Contraseña */}
              <form onSubmit={handleUpdatePassword} className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-700">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <KeyRound className="w-4.5 h-4.5 text-primary" />
                  Cambiar Contraseña
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                      Contraseña Actual
                    </label>
                    <div className="relative w-full sm:w-1/2">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2.5 pr-10 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200"
                        placeholder="Ingresa tu contraseña actual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 hover:cursor-pointer"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                        Nueva Contraseña
                      </label>
                      <div className="relative w-full">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-2.5 pr-10 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200"
                          placeholder="Mínimo 6 caracteres"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 hover:cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                        Confirmar Nueva Contraseña
                      </label>
                      <div className="relative w-full">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2.5 pr-10 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium text-slate-800 dark:text-slate-200"
                          placeholder="Confirmar contraseña"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 hover:cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50 hover:cursor-pointer"
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Actualizando Contraseña...
                      </>
                    ) : (
                      <>
                        Actualizar Contraseña
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
