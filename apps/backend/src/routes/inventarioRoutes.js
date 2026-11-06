import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { listarInsumos, crearInsumo } from '../controllers/inventarioController.js';

const router = Router();

// Catálogo de insumos (requiere sesión iniciada)
router.get('/insumos', verifyToken, listarInsumos);
router.post('/insumos', verifyToken, crearInsumo);

export default router;