// Valida las entradas HTTP del módulo de inventario y responde con el código adecuado.
import * as inventarioService from '../services/inventarioService.js';

export const listarInsumos = async (req, res) => {
    try {
        const insumos = await inventarioService.listarInsumos();
        return res.status(200).json(insumos);
    } catch (error) {
        console.error('Error al listar insumos:', error);
        return res.status(500).json({ error: 'Error al obtener los insumos.' });
    }
};

export const crearInsumo = async (req, res) => {
    try {
        const nombre = req.body.nombre?.trim();
        const unidad = req.body.unidad?.trim();

        if (!nombre || !unidad) {
            return res.status(400).json({ error: 'Nombre y unidad son requeridos.' });
        }
        if (unidad.length > 10) {
            return res.status(400).json({ error: 'La unidad no puede superar 10 caracteres.' });
        }

        const insumo = await inventarioService.crearInsumo({ nombre, unidad });
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
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
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
        if (datos.unidad && datos.unidad.length > 10) {
            return res.status(400).json({ error: 'La unidad no puede superar 10 caracteres.' });
        }

        const insumo = await inventarioService.actualizarInsumo(id, datos);
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

export const eliminarInsumo = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'El id del insumo no es válido.' });
        }

        await inventarioService.eliminarInsumo(id);
        return res.status(204).send();
    } catch (error) {
        if (error.message === 'INSUMO_NO_ENCONTRADO') {
            return res.status(404).json({ error: 'Insumo no encontrado.' });
        }
        if (error.message === 'INSUMO_EN_USO') {
            return res.status(409).json({ error: 'No se puede eliminar: el insumo está en uso en recetas, compras o inventario.' });
        }
        console.error('Error al eliminar insumo:', error);
        return res.status(500).json({ error: 'Error al eliminar el insumo.' });
    }
};

