import api from './client'

export async function coordinateBloodRequest(payload) {
  const { data } = await api.post('/api/ai/coordinate', payload)
  return data.result
}
