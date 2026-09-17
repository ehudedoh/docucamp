import { apiFetch } from './api';
export const getAdminReports = () => apiFetch('/admin/reports');
