import * as posService from '../services/posService.js';

const estadosInventario = new Map([
    ['ITEMS_INVALIDOS', 400],
    ['SUCURSAL_INVALIDA', 400],
    ['PLATILLO_NO_ENCONTRADO', 404],
    ['PLATILLO_INACTIVO', 409],
    ['PLATILLO_SIN_RECETA', 409],
    ['STOCK_INSUFICIENTE', 409],
]);

function responderError(error, res, next) {
    const status = estadosInventario.get(error.message) ?? error.status;

    if (!Number.isInteger(status) || status < 400 || status >= 500) {
        return next(error);
    }

    const respuesta = { error: error.mensaje ?? error.message };

    if (error.detalle !== undefined) {
        respuesta.detalle = error.detalle;
    }

    return res.status(status).json(respuesta);
}

export async function crearVenta(req, res, next) {
    try {
        const venta = await posService.crearVenta(req.usuario, req.body);

        return res
            .location(`/api/pos/ventas/${venta.id}`)
            .status(201)
            .json(venta);
    } catch (error) {
        return responderError(error, res, next);
    }
}

export async function listarVentas(req, res, next) {
    try {
        const ventas = await posService.listarVentas(req.usuario, req.query);
        return res.json(ventas);
    } catch (error) {
        return responderError(error, res, next);
    }
}

export async function obtenerVentaPorId(req, res, next) {
    try {
        const venta = await posService.obtenerVentaPorId(
            req.usuario,
            req.params.id,
        );
        return res.json(venta);
    } catch (error) {
        return responderError(error, res, next);
    }
}

// GET /api/pos/platillos
export async function listarPlatillosPOS(req, res, next) {
    try {
        const platillos = await posService.listarPlatillosPOS(req.usuario);
        return res.status(200).json(platillos);
    } catch (error) {
        return responderError(error, res, next);
    }
}

// GET /api/pos/platillos/:id
export async function obtenerDetallePlatilloPOS(req, res, next) {
    try {
        const platillo = await posService.obtenerDetallePlatilloPOS(
            req.usuario,
            req.params.id
        );

        return res.status(200).json(platillo);
    } catch (error) {
        return responderError(error, res, next);
    }
}