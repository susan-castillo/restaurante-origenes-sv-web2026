// Valida las entradas HTTP del catálogo de insumos y responde con el código adecuado.
import * as insumosService from '../services/insumosService.js';
import { idValido, filtroActivo, filtroBuscar } from '../utils/validaciones.js';

// Unidades permitidas (el esquema de la base del equipo solo admite estas tres).
const UNIDADES_INSUMO = ['g', 'ml', 'unidad'];
const MENSAJE_UNIDAD = 'La unidad debe ser g, ml o unidad.';

export const listarInsumos = async (req, res) => {
    try {
        const { valor: activo, error: errorActivo } = filtroActivo(req.query.activo);
        if (errorActivo) {
            return res.status(400).json({ error: errorActivo });
        }
        const { valor: buscar, error: errorBuscar } = filtroBuscar(req.query.buscar);
        if (errorBuscar) {
            return res.status(400).json({ error: errorBuscar });
        }

        let sucursalId;
        if (req.query.sucursal_id !== undefined) {
            sucursalId = idValido(req.query.sucursal_id);
            if (!sucursalId) {
                return res.status(400).json({ error: 'El filtro sucursal_id no es válido.' });
            }
            // Un usuario con sucursal fija no puede consultar otra
            const propia = idValido(req.usuario.sucursal_id);
            if (propia && propia !== sucursalId) {
                return res.status(403).json({ error: 'Solo puedes consultar la sucursal asignada a tu usuario.' });
            }
        }

        const insumos = await insumosService.listarInsumos({ activo, buscar, sucursalId });
        return res.status(200).json(insumos);
    } catch (error) {
        if (error.message === 'SUCURSAL_NO_ENCONTRADA') {
            return res.status(404).json({ error: 'Sucursal no encontrada.' });
        }
        console.error('Error al listar insumos:', error);
        return res.status(500).json({ error: 'Error al obtener los insumos.' });
    }
};

export const crearInsumo = async (req, res) => {
    try {
        const body = req.body ?? {};
        const nombre = String(body.nombre ?? '').trim();
        const unidad = String(body.unidad ?? '').trim().toLowerCase();

        if (!nombre || !unidad) {
            return res.status(400).json({ error: 'Nombre y unidad son requeridos.' });
        }
        if (nombre.length > 100) {
            return res.status(400).json({ error: 'El nombre no puede superar 100 caracteres.' });
        }
        if (!UNIDADES_INSUMO.includes(unidad)) {
            return res.status(400).json({ error: MENSAJE_UNIDAD });
        }

        const insumo = await insumosService.crearInsumo({ nombre, unidad });
        return res.status(201).json(insumo);
    } catch (error) {
        if (error.message === 'INSUMO_DUPLICADO') {
            return res.status(409).json({ error: 'Ya existe un insumo con ese nombre.' });
        }
        console.error('Error al crear insumo:', error);
        return res.status(500).json({ error: 'Error al crear el insumo.' });
    }
};

export const actualizarInsumo = async (req, res) => {
    try {
        const id = idValido(req.params.id);
        if (!id) {
            return res.status(400).json({ error: 'El id del insumo no es válido.' });
        }

        const body = req.body ?? {};
        const datos = {};
        if (body.nombre !== undefined) datos.nombre = String(body.nombre).trim();
        if (body.unidad !== undefined) datos.unidad = String(body.unidad).trim().toLowerCase();

        if (Object.keys(datos).length === 0) {
            return res.status(400).json({ error: 'Envía al menos nombre o unidad.' });
        }
        if (datos.nombre === '' || datos.unidad === '') {
            return res.status(400).json({ error: 'Nombre y unidad no pueden estar vacíos.' });
        }
        if (datos.nombre && datos.nombre.length > 100) {
            return res.status(400).json({ error: 'El nombre no puede superar 100 caracteres.' });
        }
        if (datos.unidad && !UNIDADES_INSUMO.includes(datos.unidad)) {
            return res.status(400).json({ error: MENSAJE_UNIDAD });
        }

        const insumo = await insumosService.actualizarInsumo(id, datos);
        return res.status(200).json(insumo);
    } catch (error) {
        if (error.message === 'INSUMO_NO_ENCONTRADO') {
            return res.status(404).json({ error: 'Insumo no encontrado.' });
        }
        if (error.message === 'INSUMO_DUPLICADO') {
            return res.status(409).json({ error: 'Ya existe un insumo con ese nombre.' });
        }
        console.error('Error al actualizar insumo:', error);
        return res.status(500).json({ error: 'Error al actualizar el insumo.' });
    }
};

// PATCH /insumos/:id/estado  con cuerpo { "activo": true|false }
export const cambiarEstadoInsumo = async (req, res) => {
    try {
        const id = idValido(req.params.id);
        if (!id) {
            return res.status(400).json({ error: 'El id del insumo no es válido.' });
        }
        if (typeof req.body?.activo !== 'boolean') {
            return res.status(400).json({ error: 'El campo activo debe ser true o false.' });
        }
        const insumo = await insumosService.cambiarEstadoInsumo(id, req.body.activo);
        return res.status(200).json(insumo);
    } catch (error) {
        if (error.message === 'INSUMO_NO_ENCONTRADO') {
            return res.status(404).json({ error: 'Insumo no encontrado.' });
        }
        console.error('Error al cambiar el estado del insumo:', error);
        return res.status(500).json({ error: 'Error al cambiar el estado del insumo.' });
    }
};