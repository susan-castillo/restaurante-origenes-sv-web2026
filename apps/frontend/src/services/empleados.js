import { apiFetch } from './api.js';

// Obtener empleados filtrados por sucursal (y búsqueda opcional en servidor)
export async function obtenerEmpleados(sucursalId, buscar = '') {
    const params = new URLSearchParams();
    if (sucursalId) params.append('sucursal_id', sucursalId);
    if (buscar.trim()) params.append('buscar', buscar.trim());
    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiFetch(`/rrhh/empleados${query}`);
}

// Buscar empleado por nombre exacto/parcial
export async function buscarEmpleadoPorNombre(nombre, sucursalId) {
    const params = new URLSearchParams({ nombre });
    if (sucursalId) params.append('sucursal_id', sucursalId);
    return await apiFetch(`/rrhh/empleados/buscar?${params.toString()}`);
}

// Crear nuevo empleado (envía sucursal_id requerido por resolverSucursal)
export async function crearEmpleado(datosEmpleado) {
    return await apiFetch('/rrhh/empleados', {
        method: 'POST',
        body: JSON.stringify(datosEmpleado),
    });
}

// Actualizar datos de un empleado (pasa sucursal_id en query para Admin Global)
export async function actualizarEmpleado(id, datosEmpleado, sucursalActivaId) {
    const query = sucursalActivaId ? `?sucursal_id=${encodeURIComponent(sucursalActivaId)}` : '';
    return await apiFetch(`/rrhh/empleados/${id}${query}`, {
        method: 'PUT',
        body: JSON.stringify(datosEmpleado),
    });
}

// Cambiar contraseña de un empleado
export async function cambiarPasswordEmpleado(id, password, sucursalActivaId) {
    const query = sucursalActivaId ? `?sucursal_id=${encodeURIComponent(sucursalActivaId)}` : '';
    return await apiFetch(`/rrhh/empleados/${id}/password${query}`, {
        method: 'PATCH',
        body: JSON.stringify({ password }),
    });
}

// Desactivar (deshabilitar) empleado
export async function desactivarEmpleado(id, sucursalActivaId) {
    const query = sucursalActivaId ? `?sucursal_id=${encodeURIComponent(sucursalActivaId)}` : '';
    return await apiFetch(`/rrhh/empleados/desactivar/${id}${query}`, {
        method: 'DELETE',
    });
}

// Volver a habilitar un empleado inactivo
export async function habilitarEmpleado(id, sucursalActivaId) {
    return await actualizarEmpleado(id, { activo: true }, sucursalActivaId);
}