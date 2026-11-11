import { Router } from "express";
import * as sucursalController from "../controllers/sucursalController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import { cargarAccesoSucursales, requireAdminCentral } from "../middlewares/sucursalAccess.js";
const router = Router();
router.use(verifyToken, cargarAccesoSucursales);

// GET /api/sucursales/dashboard/estadisticas - Resumen global de Administración central

router.get(
  "/dashboard/estadisticas",
  requireAdminCentral,
  sucursalController.getEstadisticasDashboard,
);

// GET /api/sucursales — Obtener la lista de sucursales activas
router.get("/", sucursalController.getSucursales);
router.get("/:id", requireRole("ADMIN"), sucursalController.getSucursalPorId);
router.post("/", requireAdminCentral, sucursalController.registrarSucursal);
router.patch("/:id", requireAdminCentral, sucursalController.actualizarSucursal);
router.put("/:id", requireAdminCentral, sucursalController.actualizarSucursal);
router.delete("/:id", requireAdminCentral, sucursalController.desactivarSucursal);

export default router;
