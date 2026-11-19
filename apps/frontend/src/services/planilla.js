import { apiFetch } from './api.js';

// Previsualizar cálculo de planilla sin guardar en BD
export async function simularPlanilla({ anio, mes, quincena, sucursalId }) {
    const query = sucursalId ? `?sucursal_id=${encodeURIComponent(sucursalId)}` : '';
    return await apiFetch(`/nomina/simular${query}`, {
        method: 'POST',
        body: JSON.stringify({
            anio: Number(anio),
            mes: Number(mes),
            quincena: Number(quincena),
            ...(sucursalId ? { sucursal_id: Number(sucursalId) } : {}),
        }),
    });
}

// Confirmar y guardar la planilla en BD (Solo ADMIN)
export async function generarPlanilla({ anio, mes, quincena, sucursalId }) {
    const query = sucursalId ? `?sucursal_id=${encodeURIComponent(sucursalId)}` : '';
    return await apiFetch(`/nomina/generar${query}`, {
        method: 'POST',
        body: JSON.stringify({
            anio: Number(anio),
            mes: Number(mes),
            quincena: Number(quincena),
            ...(sucursalId ? { sucursal_id: Number(sucursalId) } : {}),
        }),
    });
}

// Consultar si la planilla de un período ya fue generada anteriormente
export async function obtenerPlanilla({ anio, mes, quincena, sucursalId }) {
    const query = sucursalId ? `?sucursal_id=${encodeURIComponent(sucursalId)}` : '';
    return await apiFetch(`/nomina/${anio}/${mes}/${quincena}${query}`);
}