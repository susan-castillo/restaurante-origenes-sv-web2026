// Valida las entradas HTTP del menú de platillos y responde con el código adecuado.
import * as platillosService from '../services/platillosService.js';
import { idValido, aNumero } from '../utils/validaciones.js';

const TIPOS_PLATILLO = ['ELABORADO', 'REVENTA'];

// Valida y normaliza el cuerpo de un platillo.
// parcial = true (PUT): valida solo los campos enviados. Si no, exige nombre y precio.
const validarPlatillo = (body, { parcial = false } = {}) => {
    const datos = {};

    if (body.nombre !== undefined) {
        const nombre = String(body.nombre).trim();
        if (!nombre || nombre.length > 100) {
            return { error: 'El nombre es requerido y no puede superar 100 caracteres.' };
        }
        datos.nombre = nombre;
    }

    if (body.categoria !== undefined) {
        const categoria = body.categoria === null ? '' : String(body.categoria).trim();
        if (categoria.length > 50) {
            return { error: 'La categoría no puede superar 50 caracteres.' };
        }
        datos.categoria = categoria || null;
    }

    if (body.precio !== undefined) {
        const precio = aNumero(body.precio);
        if (!Number.isFinite(precio) || precio < 0 || precio > 999999.99) {
            return { error: 'El precio debe ser un número entre 0 y 999999.99.' };
        }
        datos.precio = precio;
    }

    if (body.tipo !== undefined) {
        const tipo = String(body.tipo).trim().toUpperCase();
        if (!TIPOS_PLATILLO.includes(tipo)) {
            return { error: 'El tipo debe ser ELABORADO o REVENTA.' };
        }
        datos.tipo = tipo;
    }

    if (body.activo !== undefined) {
        if (typeof body.activo !== 'boolean') {
            return { error: 'El campo activo debe ser true o false.' };
        }
        datos.activo = body.activo;
    }

    if (parcial) {
        if (Object.keys(datos).length === 0) {
            return { error: 'Envía al menos un campo para actualizar.' };
        }
    } else if (datos.nombre === undefined || datos.precio === undefined) {
        return { error: 'Nombre y precio son requeridos.' };
    }

    return { datos };
};

export const listarPlatillos = async (req, res) => {
    try {
        const { tipo, activo } = req.query;

        let tipoFiltro;
        if (tipo !== undefined) {
            tipoFiltro = String(tipo).trim().toUpperCase();
            if (!TIPOS_PLATILLO.includes(tipoFiltro)) {
                return res.status(400).json({ error: 'El filtro tipo debe ser ELABORADO o REVENTA.' });
            }
        }

        let activoFiltro;
        if (activo !== undefined) {
            if (activo !== 'true' && activo !== 'false') {
                return res.status(400).json({ error: 'El filtro activo debe ser true o false.' });
            }
            activoFiltro = activo === 'true';
        }

        const platillos = await platillosService.listarPlatillos({
            tipo: tipoFiltro,
            activo: activoFiltro,
        });
        return res.status(200).json(platillos);
    } catch (error) {
        console.error('Error al listar platillos:', error);
        return res.status(500).json({ error: 'Error al obtener los platillos.' });
    }
};

export const obtenerPlatillo = async (req, res) => {
    try {
        const id = idValido(req.params.id);
        if (!id) {
            return res.status(400).json({ error: 'El id del platillo no es válido.' });
        }
        const platillo = await platillosService.obtenerPlatillo(id);
        return res.status(200).json(platillo);
    } catch (error) {
        if (error.message === 'PLATILLO_NO_ENCONTRADO') {
            return res.status(404).json({ error: 'Platillo no encontrado.' });
        }
        console.error('Error al obtener platillo:', error);
        return res.status(500).json({ error: 'Error al obtener el platillo.' });
    }
};

export const crearPlatillo = async (req, res) => {
    try {
        const { datos, error } = validarPlatillo(req.body);
        if (error) {
            return res.status(400).json({ error });
        }
        const platillo = await platillosService.crearPlatillo(datos);
        return res.status(201).json(platillo);
    } catch (error) {
        console.error('Error al crear platillo:', error);
        return res.status(500).json({ error: 'Error al crear el platillo.' });
    }
};

export const actualizarPlatillo = async (req, res) => {
    try {
        const id = idValido(req.params.id);
        if (!id) {
            return res.status(400).json({ error: 'El id del platillo no es válido.' });
        }
        const { datos, error } = validarPlatillo(req.body, { parcial: true });
        if (error) {
            return res.status(400).json({ error });
        }
        const platillo = await platillosService.actualizarPlatillo(id, datos);
        return res.status(200).json(platillo);
    } catch (error) {
        if (error.message === 'PLATILLO_NO_ENCONTRADO') {
            return res.status(404).json({ error: 'Platillo no encontrado.' });
        }
        console.error('Error al actualizar platillo:', error);
        return res.status(500).json({ error: 'Error al actualizar el platillo.' });
    }
};

// PATCH /platillos/:id/estado  con cuerpo { "activo": true|false }
export const cambiarEstadoPlatillo = async (req, res) => {
    try {
        const id = idValido(req.params.id);
        if (!id) {
            return res.status(400).json({ error: 'El id del platillo no es válido.' });
        }
        if (typeof req.body.activo !== 'boolean') {
            return res.status(400).json({ error: 'El campo activo debe ser true o false.' });
        }
        const platillo = await platillosService.cambiarEstadoPlatillo(id, req.body.activo);
        return res.status(200).json(platillo);
    } catch (error) {
        if (error.message === 'PLATILLO_NO_ENCONTRADO') {
            return res.status(404).json({ error: 'Platillo no encontrado.' });
        }
        console.error('Error al cambiar el estado del platillo:', error);
        return res.status(500).json({ error: 'Error al cambiar el estado del platillo.' });
    }
};