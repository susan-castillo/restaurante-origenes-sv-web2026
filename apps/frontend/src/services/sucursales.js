import { apiFetch } from './api.js';

// Obtener la lista general de sucursales
export const getSucursales = () => apiFetch('/sucursales/');