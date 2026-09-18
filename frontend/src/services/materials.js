import { apiFetch } from './api.js'

export function listMaterials(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return apiFetch(`/materials${qs ? `?${qs}` : ''}`)
}

export function getMaterial(id) {
  return apiFetch(`/materials/${id}`)
}

export function createMaterial(payload) {
  return apiFetch('/materials', { method: 'POST', body: payload })
}

export function updateMaterial(id, payload) {
  return apiFetch(`/materials/${id}`, { method: 'PATCH', body: payload })
}

export function deleteMaterial(id) {
  return apiFetch(`/materials/${id}`, { method: 'DELETE' })
}

export function reportMaterial(id, payload) {
  return apiFetch(`/materials/${id}/report`, { method: 'POST', body: payload })
}