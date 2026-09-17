import { apiFetch } from './api';
export const getInstitutions = () => apiFetch('/institutions');
