import * as proveedorService from '../services/proveedorService.js';
import { idValido } from '../utils/validaciones.js';

function leerId(valor) {
    if (!/^\d+$/.test(valor)) return null;

    const id = idValido(valor);
    return id !== null && id <= 2_147_483_647 ? id : null;
}

function leerDatos(body) {
    const nombre = typeof body?.nombre === 'string' ? body.nombre.trim() : '';

    if (nombre.length === 0 || nombre.length > 100) {
        return { error: 'El nombre es obligatorio y admite hasta 100 caracteres.' };
    }

    if (body.nit != null && typeof body.nit !== 'string') {
        return { error: 'El NIT debe enviarse como texto o null.' };
    }

    const nit = body.nit?.trim() || null;
    if (nit && nit.length > 20) {
        return { error: 'El NIT admite hasta 20 caracteres.' };
    }

    return { datos: { nombre, nit } };
}

export async function listarProveedores(req, res) {
    const proveedores = await proveedorService.listarProveedores();
    return res.json(proveedores);
}

export async function obtenerProveedor(req, res) {
    const id = leerId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'El ID del proveedor no es válido.' });

    const proveedor = await proveedorService.obtenerProveedor(id);
    if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado.' });

    return res.json(proveedor);
}

export async function crearProveedor(req, res) {
    const { datos, error } = leerDatos(req.body);
    if (error) return res.status(400).json({ error });

    const proveedor = await proveedorService.crearProveedor(datos);
    return res.location(`/api/proveedores/${proveedor.id}`).status(201).json(proveedor);
}

export async function actualizarProveedor(req, res) {
    const id = leerId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'El ID del proveedor no es válido.' });

    const { datos, error } = leerDatos(req.body);
    if (error) return res.status(400).json({ error });

    try {
        const proveedor = await proveedorService.actualizarProveedor(id, datos);
        return res.json(proveedor);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Proveedor no encontrado.' });
        }
        throw error;
    }
}

export async function eliminarProveedor(req, res) {
    const id = leerId(req.params.id);
    if (id === null) return res.status(400).json({ error: 'El ID del proveedor no es válido.' });

    try {
        await proveedorService.eliminarProveedor(id);
        return res.status(204).end();
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Proveedor no encontrado.' });
        }
        if (error.code === 'P2003') {
            return res.status(409).json({ error: 'El proveedor tiene compras asociadas.' });
        }
        throw error;
    }
}
