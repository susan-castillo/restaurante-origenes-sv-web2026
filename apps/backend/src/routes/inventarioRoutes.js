import { Router } from 'express';
import {
    listarInsumos,
    crearInsumo,
    actualizarInsumo,
    cambiarEstadoInsumo,
} from '../controllers/insumosController.js';
import {
    listarPlatillos,
    obtenerPlatillo,
    crearPlatillo,
    actualizarPlatillo,
    cambiarEstadoPlatillo,
} from '../controllers/platillosController.js';
import {
    obtenerReceta,
    reemplazarReceta,
} from '../controllers/recetasController.js';
import {
    listarInventario,
    listarAlertas,
    ajustarInventario,
} from '../controllers/inventarioController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRole, requireAdminOBarista } from '../middlewares/roleMiddleware.js';
import { cargarAccesoSucursales, requireAdminCentral } from '../middlewares/sucursalAccess.js';

const router = Router();

// Sesión: verifica el JWT y relee rol, cargo y sucursal vigentes desde la base.
// Va ruta por ruta y no con router.use porque este router está montado en /api:
// un router.use aquí también interceptaría las rutas de otros módulos.
const sesion = [verifyToken, cargarAccesoSucursales];

const soloAdmin = requireRole('ADMIN');
const adminOEmpleado = requireRole('ADMIN', 'EMPLEADO');

// Catálogos globales (platillos, recetas, insumos):
//  - leer: ADMIN y EMPLEADO (el POS necesita el menú; los insumos, solo ADMIN)
//  - escribir: solo el admin central, porque afecta a todas las sucursales

// Platillos (el menú)
router.get('/platillos', sesion, adminOEmpleado, listarPlatillos);
router.get('/platillos/:id', sesion, adminOEmpleado, obtenerPlatillo);
router.post('/platillos', sesion, requireAdminCentral, crearPlatillo);
router.put('/platillos/:id', sesion, requireAdminCentral, actualizarPlatillo);
router.patch('/platillos/:id/estado', sesion, requireAdminCentral, cambiarEstadoPlatillo);

// Receta de un platillo
router.get('/platillos/:id/receta', sesion, adminOEmpleado, obtenerReceta);
router.put('/platillos/:id/receta', sesion, requireAdminCentral, reemplazarReceta);

// Insumos (catálogo); "eliminar" = desactivar
router.get('/insumos', sesion, soloAdmin, listarInsumos);
router.post('/insumos', sesion, requireAdminCentral, crearInsumo);
router.put('/insumos/:id', sesion, requireAdminCentral, actualizarInsumo);
router.patch('/insumos/:id/estado', sesion, requireAdminCentral, cambiarEstadoInsumo);

// Inventario por sucursal: ADMIN y BARISTA. Qué sucursal ve cada uno lo decide
// resolverSucursal en el controller (su propia sucursal, o la elegida si es admin central).
router.get('/inventario', sesion, requireAdminOBarista, listarInventario);
router.get('/inventario/alertas', sesion, requireAdminOBarista, listarAlertas);
router.put('/inventario/:insumoId', sesion, requireAdminOBarista, ajustarInventario);

export default router;