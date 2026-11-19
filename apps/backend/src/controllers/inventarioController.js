// Valida las entradas HTTP del inventario por sucursal y responde con el código adecuado.
import * as inventarioService from '../services/inventarioService.js';
import { idValido, aNumero, filtroBuscar } from '../utils/validaciones.js';

// Decide qué sucursal usa la petición.
//  - Usuario con sucursal_id (admin de sede, empleado): solo la suya. Pedir otra da 403.
//  - Usuario sin sucursal_id y rol ADMIN (admin central): elige con ?sucursal_id=.
//  - Cualquier otro caso: 400.
const resolverSucursal = (req) => {
    const propia = idValido(req.usuario.sucursal_id);
    const pedida = req.query.sucursal_id;

    if (propia) {
        if (pedida !== undefined && idValido(pedida) !== propia) {
            return { status: 403, error: 'Solo puedes consultar la sucursal asignada a tu usuario.' };
        }
        return { sucursalId: propia };
    }

    if (req.usuario.rol === 'ADMIN') {
        const elegida = idValido(pedida);
        if (!elegida) {
            return { status: 400, error: 'Indica la sucursal con ?sucursal_id=.' };
        }
        return { sucursalId: elegida };
    }

    return { status: 400, error: 'Tu usuario no tiene una sucursal asignada.' };
};

export const listarInventario = async (req, res) => {
    try {
        const { sucursalId, status, error: errorSucursal } = resolverSucursal(req);
        if (!sucursalId) {
            return res.status(status).json({ error: errorSucursal });
        }
        const { valor: buscar, error: errorBuscar } = filtroBuscar(req.query.buscar);
        if (errorBuscar) {
            return res.status(400).json({ error: errorBuscar });
        }
        const estado = req.query.estado ?? 'todos';
        if (!inventarioService.ESTADOS_INVENTARIO.includes(estado)) {
            return res.status(400).json({ error: 'El filtro estado debe ser todos, bajo, agotados o deshabilitados.' });
        }
        const inventario = await inventarioService.listarInventario(sucursalId, { buscar, estado });
        return res.status(200).json(inventario);
    } catch (error) {
        console.error('Error al listar inventario:', error);
        return res.status(500).json({ error: 'Error al obtener el inventario.' });
    }
};

export const listarAlertas = async (req, res) => {
    try {
        const { sucursalId, status, error: errorSucursal } = resolverSucursal(req);
        if (!sucursalId) {
            return res.status(status).json({ error: errorSucursal });
        }
        const { valor: buscar, error: errorBuscar } = filtroBuscar(req.query.buscar);
        if (errorBuscar) {
            return res.status(400).json({ error: errorBuscar });
        }
        const alertas = await inventarioService.listarAlertas(sucursalId, { buscar });
        return res.status(200).json(alertas);
    } catch (error) {
        console.error('Error al listar alertas de stock:', error);
        return res.status(500).json({ error: 'Error al obtener las alertas de stock.' });
    }
};

// PUT /inventario/:insumoId  con cuerpo { "stock_actual": 100, "stock_minimo": 50 } (uno o ambos)
export const ajustarInventario = async (req, res) => {
    try {
        const { sucursalId, status, error: errorSucursal } = resolverSucursal(req);
        if (!sucursalId) {
            return res.status(status).json({ error: errorSucursal });
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
        if (error.message === 'SUCURSAL_INACTIVA') {
            return res.status(409).json({ error: 'La sucursal está desactivada.' });
        }
        if (error.message === 'INSUMO_NO_ENCONTRADO') {
            return res.status(404).json({ error: 'Insumo no encontrado.' });
        }
        console.error('Error al ajustar inventario:', error);
        return res.status(500).json({ error: 'Error al ajustar el inventario.' });
    }
};