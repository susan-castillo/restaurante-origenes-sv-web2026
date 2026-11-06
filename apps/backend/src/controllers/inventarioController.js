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