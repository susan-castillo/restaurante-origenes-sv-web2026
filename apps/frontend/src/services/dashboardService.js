import { apiFetch } from './api.js';

// GET /api/sucursales/dashboard/estadisticas
// VITE_API_URL ya es "/api", por eso aquí NO se escribe /api al inicio.
// Solo la responde el admin central: para los demás el backend devuelve 403.
export const getEstadisticasDashboard = () =>
    apiFetch('/sucursales/dashboard/estadisticas');