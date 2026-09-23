import { apiFetch } from './api.js'

export function listNotifications({ unread = false } = {}) {
  return apiFetch(`/notifications${unread ? '?unread=1' : ''}`)
}

export function unreadCount() {
  return apiFetch('/notifications/unread-count')
}

export function markRead(id) {
  return apiFetch(`/notifications/${id}/read`, { method: 'PATCH' })
}

export function markAllRead() {
  return apiFetch('/notifications/read-all', { method: 'PATCH' })
}