import api from './client'

export async function loginToBackend() {
  const { data } = await api.post('/api/auth/login')
  return data.user
}

export async function registerWithBackend({ name, role, phone, bloodGroup }) {
  const { data } = await api.post('/api/auth/register', {
    name,
    role,
    phone,
    bloodGroup,
  })
  return data.user
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/api/auth/me')
  return data.user
}