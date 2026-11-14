import * as nominaService from '../services/nominaService.js';
import { aNumero, idValido } from '../utils/validaciones.js';


// Usuario de sede 
// Admin Global (ADMIN con sucursal_id null)
const resolverSucursal = async (req) => {
    const { rol, sucursal_id } = await nominaService.obtenerAccesoUsuario(req.usuario.id);

    if (sucursal_id != null) {
        return idValido(sucursal_id);
    }
    if (rol !== 'ADMIN') {
        return null; // sin sucursal y no es admin: responde 400
    }
    return idValido(req.query.sucursal_id ?? req.body?.sucursal_id);
};

// Valida el formato del período y lo convierte a números.
const validarPeriodo = (valores = {}) => {
    const anio = aNumero(valores.anio);
    const mes = aNumero(valores.mes);
    const quincena = aNumero(valores.quincena);

    if (!Number.isInteger(anio) || anio < 2020 || anio > 2100) {
        return { error: 'El año no es válido.' };
    }
    if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
        return { error: 'El mes debe estar entre 1 y 12.' };
    }
    if (![1, 2].includes(quincena)) {
        return { error: 'La quincena debe ser 1 o 2.' };
    }
    return { periodo: { anio, mes, quincena } };
};

const manejarError = (error, res, mensajeGenerico) => {
    if (error.status) {
        return res.status(error.status).json({ error: error.message });
    }
    if (error.code === 'P2002') {
        return res.status(409).json({ error: 'La planilla de esta quincena ya fue generada.' });
    }
    console.error(mensajeGenerico, error);
    return res.status(500).json({ error: mensajeGenerico });
};

export const simularPlanilla = async (req, res) => {
    try {
        const sucursalId = await resolverSucursal(req);
        if (!sucursalId) return res.status(400).json({ error: MENSAJE_SIN_SUCURSAL });

        const { periodo, error } = validarPeriodo(req.body);
        if (error) return res.status(400).json({ error });

        return res.status(200).json(await nominaService.simularPlanilla(periodo, sucursalId));
    } catch (error) {
        return manejarError(error, res, 'Error al simular la planilla.');
    }
};

export const generarPlanilla = async (req, res) => {
    try {
        const sucursalId = await resolverSucursal(req);
        if (!sucursalId) return res.status(400).json({ error: MENSAJE_SIN_SUCURSAL });

        const { periodo, error } = validarPeriodo(req.body);
        if (error) return res.status(400).json({ error });

        return res.status(201).json(await nominaService.generarPlanilla(periodo, sucursalId));
    } catch (error) {
        return manejarError(error, res, 'Error al generar la planilla.');
    }
};


export const obtenerPlanilla = async (req, res) => {
    try {
        const sucursalId = await resolverSucursal(req);
        if (!sucursalId) return res.status(400).json({ error: MENSAJE_SIN_SUCURSAL });

        const { periodo, error } = validarPeriodo(req.params);
        if (error) return res.status(400).json({ error });

        return res.status(200).json(await nominaService.obtenerPlanilla(periodo, sucursalId));
    } catch (error) {
        return manejarError(error, res, 'Error al consultar la planilla.');
    }
};