import { Router } from 'express';
import { listarInsumos } from '../controllers/inventarioController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Catálogo de insumos (requiere sesión iniciada)
router.get('/insumos', verifyToken, listarInsumos);

export default router;