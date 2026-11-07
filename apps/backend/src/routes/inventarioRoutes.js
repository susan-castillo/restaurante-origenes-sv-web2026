import { Router } from 'express';
import {
    listarInsumos,
    crearInsumo,
    actualizarInsumo,
    eliminarInsumo,
    listarPlatillos,
    obtenerPlatillo,
    crearPlatillo,
    actualizarPlatillo,
    desactivarPlatillo,
} from '../controllers/inventarioController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// CRUD de insumos (requiere sesión iniciada)
router.get('/insumos', verifyToken, listarInsumos);
router.post('/insumos', verifyToken, crearInsumo);
router.put('/insumos/:id', verifyToken, actualizarInsumo);
router.delete('/insumos/:id', verifyToken, eliminarInsumo);

// CRUD de platillos (el menú); DELETE desactiva
router.get('/platillos', verifyToken, listarPlatillos);
router.get('/platillos/:id', verifyToken, obtenerPlatillo);
router.post('/platillos', verifyToken, crearPlatillo);
router.put('/platillos/:id', verifyToken, actualizarPlatillo);
router.delete('/platillos/:id', verifyToken, desactivarPlatillo);

export default router;