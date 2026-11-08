import * as sucursalService from '../services/sucursalService.js';

// Controlador para listar sucursales
export const getSucursales = async (req, res) => {
    try {
        // Le pasamos req.usuario (que lo inyecta verifyToken)
        const sucursales = await sucursalService.getSucursales(req.usuario);
        return res.status(200).json(sucursales);
    } catch (error) {
        console.error('Error al obtener sucursales:', error);
        return res.status(500).json({ error: 'Error al obtener la lista de sucursales.' });
    }
};