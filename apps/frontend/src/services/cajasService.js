import { apiFetch } from './api.js';

// Consultar si la sucursal actual tiene una caja abierta
export const getEstadoCaja = (sucursalId) =>
    apiFetch(`/caja/estado?sucursal_id=${sucursalId}`);

export const getMiTurno = () => apiFetch('/caja/mi-turno');

export const abrirCaja = (montoInicial) => apiFetch('/caja/apertura', {
    method: 'POST',
    body: JSON.stringify({ monto_inicial: montoInicial }),
});

export const cerrarCaja = (turnoId, efectivoContado) => apiFetch(`/caja/cierre/${encodeURIComponent(turnoId)}`, {
    method: 'PUT',
    body: JSON.stringify({ efectivo_contado: efectivoContado }),
});
