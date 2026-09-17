import { apiFetch } from './api';
export const login = credentials => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const register = data => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) });
