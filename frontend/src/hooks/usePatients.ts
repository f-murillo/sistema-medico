import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { patientService } from '@/services/patientService'

export const usePatients = () => {
  const queryClient = useQueryClient()

  const patientsQuery = useQuery({
    queryKey: ['patients'],
    queryFn: patientService.getPatients,
  })

  const createPatientMutation = useMutation({
    mutationFn: patientService.createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })

  const updatePatientMutation = useMutation({
    mutationFn: patientService.updatePatient,
    onSuccess: (_, patient) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      queryClient.invalidateQueries({ queryKey: ['patient', patient.id] })
    },
  })

  const deletePatientMutation = useMutation({
    mutationFn: patientService.deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
  })

  return {
    patients: patientsQuery.data ?? [],
    isLoading: patientsQuery.isLoading,
    isError: patientsQuery.isError,
    error: patientsQuery.error,
    createPatient: createPatientMutation.mutate,
    isCreating: createPatientMutation.isPending,
    updatePatient: updatePatientMutation.mutate,
    isUpdating: updatePatientMutation.isPending,
    deletePatient: deletePatientMutation.mutate,
    isDeleting: deletePatientMutation.isPending,
  }
}
