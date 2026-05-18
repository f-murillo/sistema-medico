import api from './api'
import type { Paciente } from '@/types'

export const patientService = {
  async getPatients(): Promise<Paciente[]> {
    const { data } = await api.get<Paciente[]>('/patients')
    return data
  },

  async createPatient(patient: Partial<Paciente>): Promise<Paciente> {
    const { data } = await api.post<Paciente>('/patients', patient)
    return data
  },

  async getPatient(id: string): Promise<Paciente> {
    const { data } = await api.get<Paciente>(`/patients?id=${id}`)
    return data
  },

  async updatePatient(patient: Paciente): Promise<void> {
    await api.put('/patients', patient)
  },

  async deletePatient(id: string): Promise<void> {
    await api.delete(`/patients?id=${id}`)
  },

  async getPatientHistory(id: string): Promise<any[]> {
    const { data } = await api.get<any[]>(`/patients?id=${id}&history=true`)
    return data
  },

  async createHistory(history: any, storagePaths: string[] = []): Promise<any> {
    const { data } = await api.post('/history', { history, storage_paths: storagePaths })
    return data
  },

  async updateHistory(history: any, storagePaths: string[] = [], deletedPaths: string[] = []): Promise<any> {
    const { data } = await api.put('/history', { history, storage_paths: storagePaths, deleted_paths: deletedPaths })
    return data
  },

  async deleteHistory(id: string): Promise<void> {
    await api.delete(`/history?id=${id}`)
  },
}
