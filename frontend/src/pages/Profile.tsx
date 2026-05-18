import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { doctorService } from '@/services/doctorService'
import type { Medico } from '@/services/doctorService'
import { User, Stethoscope, IdCard, Save, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useEffect } from 'react'

const profileSchema = z.object({
  nombre_completo: z.string().min(3, 'El nombre es demasiado corto'),
  especialidad: z.string().min(3, 'La especialidad es requerida'),
  cedula_profesional: z.string().min(5, 'La cédula profesional es requerida'),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function Profile() {
  const queryClient = useQueryClient()
  
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Mi Perfil Profesional</h2>
            <p className="text-slate-500">Gestiona tu información pública y credenciales médicas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Card de Visualización */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-center p-8">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary mx-auto mb-4">
              {profile?.nombre_completo.split(' ').map(n => n[0]).join('')}
            </div>
            <h3 className="font-bold text-xl text-slate-900">{profile?.nombre_completo}</h3>
            <p className="text-primary font-medium">{profile?.especialidad || 'Especialidad no definida'}</p>
            
          </div>
        </div>

        {/* Formulario de Edición */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Nombre Completo
                </label>
                <input
                  {...register('nombre_completo')}
                  type="text"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Dr. Nombre Apellido"
                />
                {errors.nombre_completo && <p className="text-xs text-red-500 mt-1">{errors.nombre_completo.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-primary" />
                  Especialidad Médica
                </label>
                <input
                  {...register('especialidad')}
                  type="text"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ej: Cardiología, Pediatría, etc."
                />
                {errors.especialidad && <p className="text-xs text-red-500 mt-1">{errors.especialidad.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                  <IdCard className="w-4 h-4 text-primary" />
                  Cédula Profesional / ID Médico
                </label>
                <input
                  {...register('cedula_profesional')}
                  type="text"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Nº de Cédula o Registro Profesional"
                />
                {errors.cedula_profesional && <p className="text-xs text-red-500 mt-1">{errors.cedula_profesional.message}</p>}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Perfil
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
