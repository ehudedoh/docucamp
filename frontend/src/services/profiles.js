import { apiFetch } from './api';
export const getProfile = () => apiFetch('/profiles/me');
export const updateProfile = data => apiFetch('/profiles/me', { method: 'PATCH', body: JSON.stringify(data) });
