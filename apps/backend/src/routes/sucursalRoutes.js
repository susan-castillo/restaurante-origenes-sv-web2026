import { Router } from 'express';
import { getSucursales } from '../controllers/sucursalController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// GET /api/sucursales — Obtener la lista de sucursales activas
router.get('/', verifyToken, getSucursales);

export default router;