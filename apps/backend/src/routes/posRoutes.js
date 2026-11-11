import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';

import {
    crearVenta,
    listarVentas,
    obtenerVentaPorId,
    listarPlatillosPOS,
    obtenerDetallePlatilloPOS,
} from '../controllers/posController.js';

const router = Router();

router.use(verifyToken, requireRole('ADMIN', 'EMPLEADO'));

// Platillos y disponibilidad por sucursal
router.get('/platillos', listarPlatillosPOS);
router.get('/platillos/:id', obtenerDetallePlatilloPOS);

// Ventas
router.post('/ventas', crearVenta);
router.get('/ventas', listarVentas);
router.get('/ventas/:id', obtenerVentaPorId);

export default router;