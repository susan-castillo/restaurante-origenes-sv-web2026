import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import {
    crearVenta,
    listarVentas,
    obtenerVentaPorId,
} from '../controllers/posController.js';

const router = Router();

router.use(verifyToken, requireRole('ADMIN', 'EMPLEADO'));

router.post('/ventas', crearVenta);
router.get('/ventas', listarVentas);
router.get('/ventas/:id', obtenerVentaPorId);

export default router;