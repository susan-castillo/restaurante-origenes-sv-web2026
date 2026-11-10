import { apiFetch } from './api.js';

// VITE_API_URL ya incluye /api, igual que en el servicio de autenticación.
export const getSucursales = () => apiFetch('/sucursales');
