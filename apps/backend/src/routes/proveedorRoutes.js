import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/roleMiddleware.js';
import {
    listarProveedores,
    obtenerProveedor,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
} from '../controllers/proveedorController.js';

const router = Router();

router.use(verifyToken, requireRole('ADMIN'));

router.get('/', listarProveedores);
router.get('/:id', obtenerProveedor);
router.post('/', crearProveedor);
router.put('/:id', actualizarProveedor);
router.delete('/:id', eliminarProveedor);

export default router;
