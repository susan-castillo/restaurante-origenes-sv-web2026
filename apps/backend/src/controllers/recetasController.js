// Valida las entradas HTTP de las recetas y responde con el código adecuado.
import * as recetasService from '../services/recetasService.js';
import { idValido, aNumero } from '../utils/validaciones.js';

// Valida el arreglo de ingredientes de una receta y lo normaliza.
const validarItemsReceta = (items) => {
    if (!Array.isArray(items)) {
        return { error: 'El campo items debe ser un arreglo.' };
    }
    if (items.length > 50) {
        return { error: 'Una receta no puede tener más de 50 insumos.' };
    }

    const vistos = new Set();
    const limpios = [];

    for (const item of items) {
        const insumoId = idValido(item?.insumo_id);
        if (!insumoId) {
            return { error: 'Cada item necesita un insumo_id válido.' };
        }
        if (vistos.has(insumoId)) {
            return { error: `El insumo ${insumoId} está repetido en la receta.` };
        }
        vistos.add(insumoId);

        const cantidad = aNumero(item.cantidad);
        if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 999999999) {
            return { error: `La cantidad del insumo ${insumoId} debe ser un número mayor que 0.` };
        }

        limpios.push({ insumo_id: insumoId, cantidad });
    }

    return { items: limpios };
};

export const obtenerReceta = async (req, res) => {
    try {
        const id = idValido(req.params.id);
        if (!id) {
            return res.status(400).json({ error: 'El id del platillo no es válido.' });
        }
        const receta = await recetasService.obtenerReceta(id);
        return res.status(200).json(receta);
    } catch (error) {
        if (error.message === 'PLATILLO_NO_ENCONTRADO') {
            return res.status(404).json({ error: 'Platillo no encontrado.' });
        }
        console.error('Error al obtener receta:', error);
        return res.status(500).json({ error: 'Error al obtener la receta.' });
    }
};

// PUT /platillos/:id/receta  con cuerpo { "items": [{ "insumo_id": 1, "cantidad": 18 }] }
export const reemplazarReceta = async (req, res) => {
    try {
        const id = idValido(req.params.id);
        if (!id) {
            return res.status(400).json({ error: 'El id del platillo no es válido.' });
        }
        const { items, error } = validarItemsReceta(req.body.items);
        if (error) {
            return res.status(400).json({ error });
        }
        const receta = await recetasService.reemplazarReceta(id, items);
        return res.status(200).json(receta);
    } catch (error) {
        if (error.message === 'PLATILLO_NO_ENCONTRADO') {
            return res.status(404).json({ error: 'Platillo no encontrado.' });
        }
        if (error.message === 'INSUMO_NO_ENCONTRADO') {
            return res.status(400).json({ error: 'Uno o más insumos de la receta no existen.' });
        }
        if (error.message === 'INSUMO_INACTIVO') {
            return res.status(409).json({ error: 'Uno o más insumos de la receta están desactivados.' });
        }
        console.error('Error al reemplazar receta:', error);
        return res.status(500).json({ error: 'Error al guardar la receta.' });
    }
};