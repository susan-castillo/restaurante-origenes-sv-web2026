// Valida las entradas HTTP del inventario por sucursal y responde con el código adecuado.
import * as inventarioService from '../services/inventarioService.js';
import { idValido, aNumero } from '../utils/validaciones.js';

const MENSAJE_SIN_SUCURSAL =
    'Sucursal no válida o no asignada a tu usuario. Si eres ADMIN puedes enviar ?sucursal_id=.';

// La sucursal sale del token. Un ADMIN puede indicar otra con ?sucursal_id=.
const resolverSucursal = (req) => {
    if (req.usuario.rol === 'ADMIN' && req.query.sucursal_id !== undefined) {
        return idValido(req.query.sucursal_id);
    }
    return idValido(req.usuario.sucursal_id);
};

export const listarInventario = async (req, res) => {
    try {
        const sucursalId = resolverSucursal(req);
        if (!sucursalId) {
            return res.status(400).json({ error: MENSAJE_SIN_SUCURSAL });
        }
        const inventario = await inventarioService.listarInventario(sucursalId);
        return res.status(200).json(inventario);
    } catch (error) {
        console.error('Error al listar inventario:', error);
        return res.status(500).json({ error: 'Error al obtener el inventario.' });
    }
};

export const listarAlertas = async (req, res) => {
    try {
        const sucursalId = resolverSucursal(req);
        if (!sucursalId) {
            return res.status(400).json({ error: MENSAJE_SIN_SUCURSAL });
        }
        const alertas = await inventarioService.listarAlertas(sucursalId);
        return res.status(200).json(alertas);
    } catch (error) {
        console.error('Error al listar alertas de stock:', error);
        return res.status(500).json({ error: 'Error al obtener las alertas de stock.' });
    }
};

// PUT /inventario/:insumoId  con cuerpo { "stock_actual": 100, "stock_minimo": 50 } (uno o ambos)
export const ajustarInventario = async (req, res) => {
    try {
        const sucursalId = resolverSucursal(req);
        if (!sucursalId) {
            return res.status(400).json({ error: MENSAJE_SIN_SUCURSAL });
        }
        const insumoId = idValido(req.params.insumoId);
        if (!insumoId) {
            return res.status(400).json({ error: 'El id del insumo no es válido.' });
        }

        const body = req.body ?? {};
        const datos = {};
        for (const campo of ['stock_actual', 'stock_minimo']) {
            if (body[campo] !== undefined) {
                const valor = aNumero(body[campo]);
                if (!Number.isFinite(valor) || valor < 0 || valor > 999999999) {
                    return res.status(400).json({ error: `${campo} debe ser un número entre 0 y 999999999.` });
                }
                datos[campo] = valor;
            }
        }
        if (Object.keys(datos).length === 0) {
            return res.status(400).json({ error: 'Envía stock_actual y/o stock_minimo.' });
        }

        const fila = await inventarioService.ajustarInventario(sucursalId, insumoId, datos);
        return res.status(200).json(fila);
    } catch (error) {
        if (error.message === 'SUCURSAL_NO_ENCONTRADA') {
            return res.status(404).json({ error: 'Sucursal no encontrada.' });
        }
        if (error.message === 'INSUMO_NO_ENCONTRADO') {
            return res.status(404).json({ error: 'Insumo no encontrado.' });
        }
        console.error('Error al ajustar inventario:', error);
        return res.status(500).json({ error: 'Error al ajustar el inventario.' });
    }
};