import { apiFetch } from './api.js';
import { avisarCambioInventario } from './inventarioEventos.js';

export function getResumenCompras(inicio, fin) {
    const parametros = new URLSearchParams({ fecha_inicio: inicio, fecha_fin: fin });
    return apiFetch(`/compras/resumen?${parametros}`);
}

export function getProveedores() {
    return apiFetch('/proveedores');
}

export async function registrarCompra(datos) {
    const resultado = await apiFetch('/compras', { method: 'POST', body: JSON.stringify(datos) });
    avisarCambioInventario();
    return resultado;
}
