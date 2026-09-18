import { apiFetch } from './api.js'

export function listDocuments(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return apiFetch(`/documents${qs ? `?${qs}` : ''}`)
}

export function getDocument(id) {
  return apiFetch(`/documents/${id}`)
}

export function createDocument(payload) {
  return apiFetch('/documents', { method: 'POST', body: payload })
}

export function updateDocument(id, payload) {
  return apiFetch(`/documents/${id}`, { method: 'PATCH', body: payload })
}

export function deleteDocument(id) {
  return apiFetch(`/documents/${id}`, { method: 'DELETE' })
}

export function downloadDocument(id) {
  return apiFetch(`/documents/${id}/download`, { method: 'POST' })
}

export function reportDocument(id, payload) {
  return apiFetch(`/documents/${id}/report`, { method: 'POST', body: payload })
}