import { Router } from "express";
import * as sucursalController from "../controllers/sucursalController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
const router = Router();

// GET /api/sucursales/dashboard/estadisticas - Vista solo para ADMIN

router.get(
  "/dashboard/estadisticas",
  verifyToken,
  requireRole("ADMIN"),
  sucursalController.getEstadisticasDashboard,
);

// GET /api/sucursales — Obtener la lista de sucursales activas
router.get("/", verifyToken, sucursalController.getSucursales);
router.get("/:id", verifyToken, sucursalController.getSucursalPorId);
router.post("/", verifyToken, sucursalController.registrarSucursal);
router.patch("/:id", verifyToken, sucursalController.actualizarSucursal);
router.put("/:id", verifyToken, sucursalController.actualizarSucursal);
router.delete("/:id", verifyToken, sucursalController.desactivarSucursal);

export default router;
