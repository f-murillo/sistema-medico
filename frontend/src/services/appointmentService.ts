import api from './api'
import type { Cita } from '@/types'

export const appointmentService = {
  async getAppointments(): Promise<Cita[]> {
    const { data } = await api.get<Cita[]>('/appointments')
    return data
  },

  async createAppointment(appointment: Partial<Cita>): Promise<Cita> {
    const { data } = await api.post<Cita>('/appointments', appointment)
    return data
  },

  async updateAppointment(appointment: Partial<Cita>): Promise<void> {
    await api.put('/appointments', appointment)
  },

  async deleteAppointment(id: string): Promise<void> {
    await api.delete(`/appointments?id=${id}`)
  },
}
