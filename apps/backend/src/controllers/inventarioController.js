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