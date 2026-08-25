import api from './client'

export async function createBloodRequest(payload) {
  const { data } = await api.post('/api/requests', payload)
  return data.request
}

export async function fetchMyRequests() {
  const { data } = await api.get('/api/requests/my')
  return data.requests
}

export async function fetchRequestById(id) {
  const { data } = await api.get(`/api/requests/${id}`)
  return data.request
}

export async function updateBloodRequest(id, payload) {
  const { data } = await api.patch(`/api/requests/${id}`, payload)
  return data.request
}

export async function cancelBloodRequest(id, reason) {
  const { data } = await api.post(`/api/requests/${id}/cancel`, { reason })
  return data.request
}

export async function verifyBloodRequest(id) {
  const { data } = await api.post(`/api/requests/${id}/verify`)
  return data.request
}

export async function rejectBloodRequest(id, reason) {
  const { data } = await api.post(`/api/requests/${id}/reject`, { reason })
  return data.request
}