import { apiFetch } from './api.js';

// VITE_API_URL ya incluye /api, igual que en el servicio de autenticación.
export const getSucursales = () => apiFetch('/sucursales');
export const getSucursalesAdministracion = () => apiFetch('/sucursales?todas=true');
export const getSucursalPorId = (id) => apiFetch(`/sucursales/${encodeURIComponent(id)}`);
