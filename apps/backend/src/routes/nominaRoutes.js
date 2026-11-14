import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import * as nomina from '../controllers/nominaController.js';

const soloAdmin = requireRole('ADMIN');
const router = Router();

// Primero se verifica el token, luego el rol
router.use(verifyToken);
router.use(requireRole('RRHH', 'ADMIN'));

// /api/nomina
router.post('/simular', soloAdmin, verifyToken, nomina.simularPlanilla);                           // RRHH y ADMIN
router.post('/generar',soloAdmin, verifyToken, requireRole('ADMIN'), nomina.generarPlanilla);     // solo ADMIN guarda
router.get('/:anio/:mes/:quincena', soloAdmin, verifyToken, nomina.obtenerPlanilla);               // RRHH y ADMIN

export default router;