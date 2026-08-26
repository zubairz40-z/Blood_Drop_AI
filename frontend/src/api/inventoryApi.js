import api from './client'

export async function fetchInventory() {
  const { data } = await api.get('/api/inventory')
  return data.inventory
}

export async function updateInventory(items) {
  const { data } = await api.put('/api/inventory', { items })
  return data.inventory
}

export async function adjustInventory(bloodGroup, component, delta) {
  const { data } = await api.patch('/api/inventory/adjust', { bloodGroup, component, delta })
  return data.inventory
}

export async function initializeInventory() {
  const { data } = await api.post('/api/inventory/initialize')
  return data.inventory
}
