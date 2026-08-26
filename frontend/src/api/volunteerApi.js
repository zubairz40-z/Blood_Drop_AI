import api from './client'

export async function fetchVolunteerTasks(filters = {}) {
  const params = {}
  if (filters.urgency) params.urgency = filters.urgency
  if (filters.type) params.type = filters.type
  const { data } = await api.get('/api/volunteer/tasks', { params })
  return data.tasks
}

export async function fetchMyVolunteerTasks() {
  const { data } = await api.get('/api/volunteer/tasks/my')
  return data.tasks
}

export async function fetchVolunteerHistory() {
  const { data } = await api.get('/api/volunteer/history')
  return data.tasks
}

export async function fetchVolunteerDashboard() {
  const { data } = await api.get('/api/volunteer/dashboard')
  return data.stats
}

export async function acceptVolunteerTask(taskId) {
  const { data } = await api.post(`/api/volunteer/tasks/${taskId}/accept`)
  return data.task
}

export async function startVolunteerTask(taskId) {
  const { data } = await api.patch(`/api/volunteer/tasks/${taskId}/start`)
  return data.task
}

export async function completeVolunteerTask(taskId) {
  const { data } = await api.patch(`/api/volunteer/tasks/${taskId}/complete`)
  return data.task
}

export async function cancelVolunteerTask(taskId) {
  const { data } = await api.patch(`/api/volunteer/tasks/${taskId}/cancel`)
  return data.task
}
