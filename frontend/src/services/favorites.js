import { apiFetch } from './api.js'

export function listFavorites(type = 'RESOURCE') {
  return apiFetch(`/favorites?type=${type}`)
}

export function addFavorite(type, id) {
  return apiFetch(`/favorites/${type}/${id}`, { method: 'POST' })
}

export function removeFavorite(type, id) {
  return apiFetch(`/favorites/${type}/${id}`, { method: 'DELETE' })
}