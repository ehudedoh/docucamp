import { apiFetch } from './api.js'

// Dashboard
export function getDashboard() {
  return apiFetch('/admin/dashboard')
}

// Documents
export function listPendingDocuments() {
  return apiFetch('/admin/documents/pending')
}
export function listAllDocuments(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return apiFetch(`/admin/documents${qs ? `?${qs}` : ''}`)
}
export function setDocumentStatus(id, status) {
  return apiFetch(`/admin/documents/${id}/status`, { method: 'PATCH', body: { status } })
}
export function deleteAdminDocument(id) {
  return apiFetch(`/admin/documents/${id}`, { method: 'DELETE' })
}

// Matériel
export function listPendingMaterials() {
  return apiFetch('/admin/materials/pending')
}
export function listAllMaterials(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return apiFetch(`/admin/materials${qs ? `?${qs}` : ''}`)
}
export function setMaterialStatus(id, status) {
  return apiFetch(`/admin/materials/${id}/status`, { method: 'PATCH', body: { status } })
}
export function deleteAdminMaterial(id) {
  return apiFetch(`/admin/materials/${id}`, { method: 'DELETE' })
}

// Signalements
export function listReports(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return apiFetch(`/admin/reports${qs ? `?${qs}` : ''}`)
}
export function setReportStatus(id, status) {
  return apiFetch(`/admin/reports/${id}/status`, { method: 'PATCH', body: { status } })
}

// Audit
export function listAudit(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== '' && v != null)
  ).toString()
  return apiFetch(`/admin/audit${qs ? `?${qs}` : ''}`)
}