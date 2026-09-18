import { apiFetch } from './api.js'

export function getDashboard() {
  return apiFetch('/admin/dashboard')
}

export function listPendingDocuments() {
  return apiFetch('/admin/documents/pending')
}

export function listPendingMaterials() {
  return apiFetch('/admin/materials/pending')
}

export function listReports() {
  return apiFetch('/admin/reports')
}

export function setDocumentStatus(id, status) {
  return apiFetch(`/admin/documents/${id}/status`, { method: 'PATCH', body: { status } })
}

export function setMaterialStatus(id, status) {
  return apiFetch(`/admin/materials/${id}/status`, { method: 'PATCH', body: { status } })
}

export function deleteAdminDocument(id) {
  return apiFetch(`/admin/documents/${id}`, { method: 'DELETE' })
}

export function deleteAdminMaterial(id) {
  return apiFetch(`/admin/materials/${id}`, { method: 'DELETE' })
}