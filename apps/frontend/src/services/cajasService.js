import { apiFetch } from './api.js';

// Consultar si la sucursal actual tiene una caja abierta
export const getEstadoCaja = (sucursalId) =>
    apiFetch(`/caja/estado?sucursal_id=${sucursalId}`);