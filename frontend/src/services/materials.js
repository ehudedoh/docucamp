import { apiFetch } from './api';
export const getMaterials = params => apiFetch(`/materials${params ? `?${new URLSearchParams(params)}` : ''}`);
export const createMaterial = data => apiFetch('/materials', { method: 'POST', body: JSON.stringify(data) });
