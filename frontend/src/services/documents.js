import { apiFetch } from './api';
export const getDocuments = params => apiFetch(`/documents${params ? `?${new URLSearchParams(params)}` : ''}`);
export const createDocument = data => apiFetch('/documents', { method: 'POST', body: JSON.stringify(data) });
