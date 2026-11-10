import { Router } from 'express';
import { requireRole } from '../middlewares/roles.js';
import * as rrhh from '../controllers/rrhhController.js';

const router = Router();

router.use(requireRole('RRHH', 'ADMIN'));

// /rrhh/empleados
router.get('/empleados',                   rrhh.listarUsuarios);
router.get('/empleados/buscar',            rrhh.buscarUsuarioPorNombre);
router.post('/empleados',                  rrhh.crearUsuario);
router.get('/empleados/:id',               rrhh.buscarUsuarioPorId);
router.put('/empleados/:id',               rrhh.actualizarUsuario);
router.patch('/empleados/:id/password',    rrhh.cambiarPassword);
router.delete('/empleados/desactivar/:id', rrhh.desactivarUsuario);

export default router;