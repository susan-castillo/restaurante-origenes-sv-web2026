import { apiFetch } from './api.js';

export function getResumenCompras(inicio, fin) {
    const parametros = new URLSearchParams({ fecha_inicio: inicio, fecha_fin: fin });
    return apiFetch(`/compras/resumen?${parametros}`);
}

export function getProveedores() {
    return apiFetch('/proveedores');
}

export function registrarCompra(datos) {
    return apiFetch('/compras', { method: 'POST', body: JSON.stringify(datos) });
}
