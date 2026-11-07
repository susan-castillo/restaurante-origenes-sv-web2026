import { Router } from 'express';
import {
    listarInsumos,
    crearInsumo,
    actualizarInsumo,
    listarPlatillos,
    obtenerPlatillo,
    crearPlatillo,
    actualizarPlatillo,
    cambiarEstadoPlatillo,
    obtenerReceta,
    reemplazarReceta,
} from '../controllers/inventarioController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';

const router = Router();

const soloAdmin = requireRole('ADMIN');
const empleadoOAdmin = requireRole('ADMIN', 'EMPLEADO');

// Platillos (el menú)
router.get('/platillos', verifyToken, empleadoOAdmin, listarPlatillos);
router.get('/platillos/:id', verifyToken, empleadoOAdmin, obtenerPlatillo);
router.post('/platillos', verifyToken, soloAdmin, crearPlatillo);
router.put('/platillos/:id', verifyToken, soloAdmin, actualizarPlatillo);
router.patch('/platillos/:id/estado', verifyToken, soloAdmin, cambiarEstadoPlatillo);

// Receta de un platillo
router.get('/platillos/:id/receta', verifyToken, soloAdmin, obtenerReceta);
router.put('/platillos/:id/receta', verifyToken, soloAdmin, reemplazarReceta);

// Insumos (catálogo)
router.get('/insumos', verifyToken, soloAdmin, listarInsumos);
router.post('/insumos', verifyToken, soloAdmin, crearInsumo);
router.put('/insumos/:id', verifyToken, soloAdmin, actualizarInsumo);

export default router;