import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
    listarInsumos,
    crearInsumo,
    actualizarInsumo,
    eliminarInsumo,
} from '../controllers/inventarioController.js';

const router = Router();

// CRUD de insumos (requiere sesión iniciada)
router.get('/insumos', verifyToken, listarInsumos);
router.post('/insumos', verifyToken, crearInsumo);
router.put('/insumos/:id', verifyToken, actualizarInsumo);
router.delete('/insumos/:id', verifyToken, eliminarInsumo);

export default router;