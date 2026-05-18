import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentService } from '@/services/appointmentService'
import type { Cita } from '@/types'

export function useAppointments() {
  const queryClient = useQueryClient()

  const appointmentsQuery = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentService.getAppointments(),
  })

  const createAppointmentMutation = useMutation({
    mutationFn: (appointment: Partial<Cita>) => appointmentService.createAppointment(appointment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })

  const updateAppointmentMutation = useMutation({
    mutationFn: (appointment: Partial<Cita>) => appointmentService.updateAppointment(appointment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })

  const deleteAppointmentMutation = useMutation({
    mutationFn: (id: string) => appointmentService.deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })

  return {
    appointments: appointmentsQuery.data || [],
    isLoading: appointmentsQuery.isLoading,
    isError: appointmentsQuery.isError,
    createAppointment: createAppointmentMutation.mutate,
    isCreating: createAppointmentMutation.isPending,
    updateAppointment: updateAppointmentMutation.mutate,
    isUpdating: updateAppointmentMutation.isPending,
    deleteAppointment: deleteAppointmentMutation.mutate,
    isDeleting: deleteAppointmentMutation.isPending,
  }
}
