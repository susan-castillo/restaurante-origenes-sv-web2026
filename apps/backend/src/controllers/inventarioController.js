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

const TIPOS_PLATILLO = ['ELABORADO', 'REVENTA'];

// Convierte un parámetro de ruta en id entero positivo, o null si no es válido.
const idValido = (valor) => {
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
};

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
        const crudo = body.precio;
        const precio = typeof crudo === 'number'
            ? crudo
            : (typeof crudo === 'string' && crudo.trim() !== '' ? Number(crudo) : NaN);
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

        const platillos = await inventarioService.listarPlatillos({
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
        const platillo = await inventarioService.obtenerPlatillo(id);
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
        const platillo = await inventarioService.crearPlatillo(datos);
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
        const platillo = await inventarioService.actualizarPlatillo(id, datos);
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
        const platillo = await inventarioService.cambiarEstadoPlatillo(id, req.body.activo);
        return res.status(200).json(platillo);
    } catch (error) {
        if (error.message === 'PLATILLO_NO_ENCONTRADO') {
            return res.status(404).json({ error: 'Platillo no encontrado.' });
        }
        console.error('Error al cambiar el estado del platillo:', error);
        return res.status(500).json({ error: 'Error al cambiar el estado del platillo.' });
    }
};

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

        const crudo = item.cantidad;
        const cantidad = typeof crudo === 'number'
            ? crudo
            : (typeof crudo === 'string' && crudo.trim() !== '' ? Number(crudo) : NaN);
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
        const receta = await inventarioService.obtenerReceta(id);
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
        const receta = await inventarioService.reemplazarReceta(id, items);
        return res.status(200).json(receta);
    } catch (error) {
        if (error.message === 'PLATILLO_NO_ENCONTRADO') {
            return res.status(404).json({ error: 'Platillo no encontrado.' });
        }
        if (error.message === 'INSUMO_NO_ENCONTRADO') {
            return res.status(400).json({ error: 'Uno o más insumos de la receta no existen.' });
        }
        console.error('Error al reemplazar receta:', error);
        return res.status(500).json({ error: 'Error al guardar la receta.' });
    }
};