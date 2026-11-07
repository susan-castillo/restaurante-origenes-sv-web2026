import { Router } from 'express';
import {
    listarInsumos,
    crearInsumo,
    actualizarInsumo,
} from '../controllers/insumosController.js';
import {
    listarPlatillos,
    obtenerPlatillo,
    crearPlatillo,
    actualizarPlatillo,
    cambiarEstadoPlatillo,
} from '../controllers/platillosController.js';
import {
    obtenerReceta,
    reemplazarReceta,
} from '../controllers/recetasController.js';
import {
    listarInventario,
    listarAlertas,
    ajustarInventario,
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
router.get('/platillos/:id/receta', verifyToken, empleadoOAdmin, obtenerReceta);
router.put('/platillos/:id/receta', verifyToken, empleadoOAdmin, reemplazarReceta);

// Insumos (catálogo)
router.get('/insumos', verifyToken, empleadoOAdmin, listarInsumos);
router.post('/insumos', verifyToken, empleadoOAdmin, crearInsumo);
router.put('/insumos/:id', verifyToken, empleadoOAdmin, actualizarInsumo);

// Inventario por sucursal
router.get('/inventario', verifyToken, empleadoOAdmin, listarInventario);
router.get('/inventario/alertas', verifyToken, empleadoOAdmin, listarAlertas);
router.put('/inventario/:insumoId', verifyToken, empleadoOAdmin, ajustarInventario);

export default router;