import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { patientService } from '@/services/patientService'

export function usePatientDetail(patientId: string) {
  const queryClient = useQueryClient()

  const patientQuery = useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => patientService.getPatient(patientId),
    enabled: !!patientId,
  })

  const historyQuery = useQuery({
    queryKey: ['patient-history', patientId],
    queryFn: () => patientService.getPatientHistory(patientId),
    enabled: !!patientId,
  })

  const createHistoryMutation = useMutation({
    mutationFn: ({ history, storagePaths }: { history: any, storagePaths?: string[] }) => 
      patientService.createHistory(history, storagePaths),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-history', patientId] })
    },
  })

  const updateHistoryMutation = useMutation({
    mutationFn: ({ history, storagePaths, deletedPaths }: { history: any, storagePaths?: string[], deletedPaths?: string[] }) => 
      patientService.updateHistory(history, storagePaths, deletedPaths),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-history', patientId] })
    },
  })

  const deleteHistoryMutation = useMutation({
    mutationFn: (id: string) => patientService.deleteHistory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-history', patientId] })
    },
  })

  return {
    patient: patientQuery.data,
    isLoadingPatient: patientQuery.isLoading,
    history: historyQuery.data || [],
    isLoadingHistory: historyQuery.isLoading,
    createHistory: createHistoryMutation.mutate,
    isCreatingHistory: createHistoryMutation.isPending,
    updateHistory: updateHistoryMutation.mutate,
    isUpdatingHistory: updateHistoryMutation.isPending,
    deleteHistory: deleteHistoryMutation.mutate,
    isDeletingHistory: deleteHistoryMutation.isPending,
  }
}
