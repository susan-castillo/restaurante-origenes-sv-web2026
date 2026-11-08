import * as cajaService from '../services/cajaService.js';

// Controlador para verificar el estado de la caja
export const getEstadoCaja = async (req, res) => {
    try {
        // Se puede recibir sucursal_id por query string o tomar del usuario autenticado (req.usuario)
        const sucursalId = req.query.sucursal_id || req.usuario?.sucursal_id;

        if (!sucursalId) {
            return res.status(400).json({ error: 'El parámetro sucursal_id es requerido.' });
        }

        const estado = await cajaService.getEstadoCaja(Number(sucursalId));
        return res.status(200).json(estado);
    } catch (error) {
        console.error('Error en getEstadoCaja:', error);
        return res.status(500).json({ error: 'Error al consultar el estado de la caja.' });
    }
};