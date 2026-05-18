import api from './api'

export const chatService = {
  async sendMessage(prompt: string, history: any[]): Promise<{ response: string }> {
    const { data } = await api.post<{ response: string }>('/chat', { prompt, history })
    return data
  },
}
