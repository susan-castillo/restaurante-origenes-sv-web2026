import { apiFetch } from './api.js';

// Consultar si la sucursal actual tiene una caja abierta
export const getEstadoCaja = (sucursalId) =>
    apiFetch(`/caja/estado?sucursal_id=${sucursalId}`);

export const getMiTurno = () => apiFetch('/caja/mi-turno');

export const abrirCaja = (montoInicial) => apiFetch('/caja/apertura', {
    method: 'POST',
    body: JSON.stringify({ monto_inicial: montoInicial }),
});

export const cerrarCaja = (turnoId, efectivoContado, importesReportados) => apiFetch(`/caja/cierre/${encodeURIComponent(turnoId)}`, {
    method: 'PUT',
    body: JSON.stringify({ efectivo_contado: efectivoContado, ...importesReportados }),
});

export function getHistorialCaja(filtros) {
    const parametros = new URLSearchParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
        if (valor !== '' && valor != null) parametros.set(clave, valor);
    });
    return apiFetch(`/caja/historial?${parametros}`);
}
