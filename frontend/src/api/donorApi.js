import api from './client'

export async function createDonorProfile(payload) {
  const { data } = await api.post('/api/donors/profile', payload)
  return data.profile
}

export async function fetchDonorProfile() {
  const { data } = await api.get('/api/donors/profile')
  return data.profile
}

export async function updateDonorProfile(payload) {
  const { data } = await api.patch('/api/donors/profile', payload)
  return data.profile
}

export async function setDonorAvailability(isAvailable) {
  const { data } = await api.patch('/api/donors/availability', { isAvailable })
  return data.isAvailable
}

export async function fetchDonationHistory() {
  const { data } = await api.get('/api/donors/history')
  return data
}