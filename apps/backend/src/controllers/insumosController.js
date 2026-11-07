// Valida las entradas HTTP del catálogo de insumos y responde con el código adecuado.
import * as insumosService from '../services/insumosService.js';
import { idValido, filtroActivo } from '../utils/validaciones.js';

export const listarInsumos = async (req, res) => {
    try {
        const { valor: activo, error: errorFiltro } = filtroActivo(req.query.activo);
        if (errorFiltro) {
            return res.status(400).json({ error: errorFiltro });
        }
        const insumos = await insumosService.listarInsumos({ activo });
        return res.status(200).json(insumos);
    } catch (error) {
        console.error('Error al listar insumos:', error);
        return res.status(500).json({ error: 'Error al obtener los insumos.' });
    }
};

export const crearInsumo = async (req, res) => {
    try {
        const nombre = String(req.body.nombre ?? '').trim();
        const unidad = String(req.body.unidad ?? '').trim();

        if (!nombre || !unidad) {
            return res.status(400).json({ error: 'Nombre y unidad son requeridos.' });
        }
        if (nombre.length > 100) {
            return res.status(400).json({ error: 'El nombre no puede superar 100 caracteres.' });
        }
        if (unidad.length > 10) {
            return res.status(400).json({ error: 'La unidad no puede superar 10 caracteres.' });
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

        const datos = {};
        if (req.body.nombre !== undefined) datos.nombre = String(req.body.nombre).trim();
        if (req.body.unidad !== undefined) datos.unidad = String(req.body.unidad).trim();

        if (Object.keys(datos).length === 0) {
            return res.status(400).json({ error: 'Envía al menos nombre o unidad.' });
        }
        if (datos.nombre === '' || datos.unidad === '') {
            return res.status(400).json({ error: 'Nombre y unidad no pueden estar vacíos.' });
        }
        if (datos.nombre && datos.nombre.length > 100) {
            return res.status(400).json({ error: 'El nombre no puede superar 100 caracteres.' });
        }
        if (datos.unidad && datos.unidad.length > 10) {
            return res.status(400).json({ error: 'La unidad no puede superar 10 caracteres.' });
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