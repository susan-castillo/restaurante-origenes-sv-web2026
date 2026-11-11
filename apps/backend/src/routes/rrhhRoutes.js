import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import * as rrhh from '../controllers/rrhhController.js';

const router = Router();

router.use(verifyToken);
router.use(requireRole('RRHH', 'ADMIN'));

// /api/rrhh/empleados
router.get('/empleados',                   rrhh.listarUsuarios);
router.get('/empleados/buscar',            rrhh.buscarUsuarioPorNombre);  // antes de /:id
router.post('/empleados',                  rrhh.crearUsuario);
router.get('/empleados/:id',               rrhh.buscarUsuarioPorId);
router.put('/empleados/:id',               rrhh.actualizarUsuario);
router.patch('/empleados/:id/password',    rrhh.cambiarPassword);
router.delete('/empleados/desactivar/:id', rrhh.desactivarUsuario);

export default router;