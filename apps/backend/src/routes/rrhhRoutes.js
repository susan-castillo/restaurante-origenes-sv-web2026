import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import * as rrhh from '../controllers/rrhhController.js';

const router = Router();

const soloAdmin = requireRole('ADMIN');
const empleadoOAdmin = requireRole('ADMIN', 'EMPLEADO');

// /api/rrhh/empleados
router.get('/empleados', verifyToken, soloAdmin, rrhh.listarUsuarios, );
router.get('/empleados/buscar', verifyToken, soloAdmin, rrhh.buscarUsuarioPorNombre);  // antes de /:id
router.post('/empleados', verifyToken, soloAdmin, rrhh.crearUsuario);
router.get('/empleados/:id', verifyToken, soloAdmin, rrhh.buscarUsuarioPorId);
router.put('/empleados/:id', verifyToken, soloAdmin, rrhh.actualizarUsuario);
router.patch('/empleados/:id/password', soloAdmin, verifyToken, rrhh.cambiarPassword);
router.delete('/empleados/desactivar/:id', soloAdmin,verifyToken,rrhh.desactivarUsuario);

export default router;