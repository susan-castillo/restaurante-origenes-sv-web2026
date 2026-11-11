import { Router } from "express";
import * as cajaController from "../controllers/cajaController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import { cargarAccesoSucursales } from "../middlewares/sucursalAccess.js";

const router = Router();

// GET /api/caja/estado — Obtener el estado actual de la caja
router.get("/estado", verifyToken, cajaController.getEstadoCaja);
const operador = requireRole("ADMIN", "EMPLEADO");
router.get("/mi-turno", verifyToken, operador, cajaController.getMiTurno);
router.post("/apertura", verifyToken, operador, cajaController.aperturaCaja);
router.put("/cierre/:id", verifyToken, operador, cajaController.cierreCaja);
router.get("/historial", verifyToken, cargarAccesoSucursales, requireRole("ADMIN"), cajaController.getHistorialCaja);
router.get("/cuadre/:id", verifyToken, cajaController.getCuadreTurno);

export default router;
