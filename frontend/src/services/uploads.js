import { apiFetch } from './api';
export const uploadFile = file => { const formData = new FormData(); formData.append('file', file); return apiFetch('/uploads', { method: 'POST', headers: {}, body: formData }); };
