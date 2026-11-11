import { apiFetch } from './api.js';

export function getResumenCompras(inicio, fin) {
    const parametros = new URLSearchParams({ fecha_inicio: inicio, fecha_fin: fin });
    return apiFetch(`/compras/resumen?${parametros}`);
}
