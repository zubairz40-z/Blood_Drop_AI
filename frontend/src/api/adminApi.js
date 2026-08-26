import api from './client'

export async function fetchPendingAccounts() {
  const { data } = await api.get('/api/admin/pending')
  return data.users
}

export async function approveAccount(userId) {
  const { data } = await api.patch(`/api/admin/users/${userId}/approve`)
  return data.user
}

export async function rejectAccount(userId, reason) {
  const { data } = await api.patch(`/api/admin/users/${userId}/reject`, { reason })
  return data.user
}

export async function fetchAllRequests(filters = {}) {
  const params = {}
  if (filters.status) params.status = filters.status
  if (filters.urgency) params.urgency = filters.urgency
  if (filters.search) params.search = filters.search
  const { data } = await api.get('/api/admin/requests', { params })
  return data.requests
}