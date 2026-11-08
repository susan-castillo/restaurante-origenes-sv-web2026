import { Router } from 'express';
import { getEstadoCaja } from '../controllers/cajaController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// GET /api/caja/estado — Obtener el estado actual de la caja
router.get('/estado', verifyToken, getEstadoCaja);

export default router;