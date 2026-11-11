import { apiFetch } from './api.js';

// Consultar si la sucursal actual tiene una caja abierta
export const getEstadoCaja = (sucursalId) =>
    apiFetch(`/caja/estado?sucursal_id=${sucursalId}`);

export const getMiTurno = () => apiFetch('/caja/mi-turno');

export const abrirCaja = (montoInicial) => apiFetch('/caja/apertura', {
    method: 'POST',
    body: JSON.stringify({ monto_inicial: montoInicial }),
});
