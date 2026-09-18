import { apiFetch } from './api.js'

export function uploadDocument(file) {
  const fd = new FormData()
  fd.append('file', file)
  return apiFetch('/uploads/document', { method: 'POST', body: fd })
}

export function uploadMaterialImage(file) {
  const fd = new FormData()
  fd.append('file', file)
  return apiFetch('/uploads/material-image', { method: 'POST', body: fd })
}