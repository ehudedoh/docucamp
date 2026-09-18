import { apiFetch } from './api.js'

export function listInstitutions() {
  return apiFetch('/institutions')
}

export function listPrograms(institutionId) {
  const qs = institutionId ? `?institution_id=${institutionId}` : ''
  return apiFetch(`/programs${qs}`)
}

export function listSubjects(programId) {
  const qs = programId ? `?program_id=${programId}` : ''
  return apiFetch(`/subjects${qs}`)
}