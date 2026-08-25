import api from './client'

export async function updateCurrentUser(payload) {
  const { data } = await api.patch('/api/users/me', payload)
  return data.user
}