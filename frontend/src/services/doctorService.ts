import api from './api'

export interface Medico {
  id: string
  nombre_completo: string
  especialidad: string
  cedula_profesional: string
  created_at: string
  updated_at: string
}

export const doctorService = {
  async getProfile(): Promise<Medico> {
    const { data } = await api.get('/me')
    return data
  },

  async updateProfile(profile: Partial<Medico>): Promise<void> {
    await api.put('/me', profile)
  }
}
