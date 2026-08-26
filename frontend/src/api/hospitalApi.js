import api from './client'

export async function fetchHospitals() {
  const { data } = await api.get('/api/hospitals')
  return data.hospitals
}