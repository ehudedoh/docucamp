import { apiFetch } from './api'

export function register(payload) {
  return apiFetch('/auth/register', { method: 'POST', body: payload })
}

export function login(payload) {
  return apiFetch('/auth/login', { method: 'POST', body: payload })
}

export function logout() {
  return apiFetch('/auth/logout', { method: 'POST' })
}

export function me() {
  return apiFetch('/auth/me')
}