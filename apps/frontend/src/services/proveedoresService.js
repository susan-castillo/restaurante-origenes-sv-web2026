import { apiFetch } from './api.js';

export function crearProveedor(datos) {
    return apiFetch('/proveedores', {
        method: 'POST',
        body: JSON.stringify(datos)
    });
}

export function actualizarProveedor(id, datos) {
    return apiFetch(`/proveedores/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos)
    });
}

export function eliminarProveedor(id) {
    return apiFetch(`/proveedores/${id}`, {
        method: 'DELETE'
    });
}
