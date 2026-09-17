const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
export async function apiFetch(path, options = {}) { const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options }); if (!response.ok) throw new Error(`API error: ${response.status}`); return response.status === 204 ? null : response.json(); }
