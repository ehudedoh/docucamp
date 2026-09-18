import { apiFetch } from './api'

export function getMe() {
  return apiFetch('/profiles/me')
}

export function updateMe(payload) {
  return apiFetch('/profiles/me', { method: 'PATCH', body: payload })
}