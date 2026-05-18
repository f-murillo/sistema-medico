import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/services/supabase'
import { useNavigate } from 'react-router-dom'
import { LogIn, Mail, Lock, AlertCircle, UserPlus, User, Eye, EyeOff } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre_completo: z.string().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError(null)
    
    if (isRegistering) {
      if (!data.nombre_completo) {
        setError('El nombre completo es obligatorio para el registro')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.nombre_completo,
          },
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setError('Cuenta creada. Si se requiere confirmación, revisa tu email. Si no, ya puedes ingresar.')
        setLoading(false)
        setIsRegistering(false)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        navigate('/')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-xl flex items-center justify-center mb-4 text-white animate-pulse">
            {isRegistering ? <UserPlus className="h-6 w-6" /> : <LogIn className="h-6 w-6" />}
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Sistema de Gestión</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
            {isRegistering ? 'Crea tu cuenta de médico profesional' : 'Ingresa a tu panel de control médico'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className={`px-4 py-3 rounded-lg flex items-center gap-3 text-sm ${
              error.includes('creada') ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
            }`}>
              <AlertCircle className="h-5 w-5" />
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    {...register('nombre_completo')}
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-primary focus:border-primary sm:text-sm font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="Dr. Juan Pérez"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-primary focus:border-primary sm:text-sm font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="doctor@ejemplo.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="block w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-primary focus:border-primary sm:text-sm font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all shadow-md hover:cursor-pointer"
            >
              {loading ? 'Procesando...' : (isRegistering ? 'Registrarse' : 'Entrar al Sistema')}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering)
                setError(null)
              }}
              className="w-full text-center text-sm font-bold text-primary dark:text-blue-400 hover:underline hover:cursor-pointer"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Crea una aquí'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
