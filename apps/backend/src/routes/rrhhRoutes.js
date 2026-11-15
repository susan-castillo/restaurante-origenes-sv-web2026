import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import * as rrhh from '../controllers/rrhhController.js';

const router = Router();

const soloAdmin = requireRole('ADMIN', 'RRHH');

// /api/rrhh/empleados
router.get('/empleados', verifyToken, soloAdmin, rrhh.listarUsuarios, );
router.get('/empleados/buscar', verifyToken, soloAdmin, rrhh.buscarUsuarioPorNombre);  // antes de /:id
router.post('/empleados', verifyToken, soloAdmin, rrhh.crearUsuario);
router.get('/empleados/:id', verifyToken, soloAdmin, rrhh.buscarUsuarioPorId);
router.put('/empleados/:id', verifyToken, soloAdmin, rrhh.actualizarUsuario);
router.patch('/empleados/:id/password', verifyToken, soloAdmin, rrhh.cambiarPassword);
router.delete('/empleados/desactivar/:id', verifyToken, soloAdmin, rrhh.desactivarUsuario);

export default router;