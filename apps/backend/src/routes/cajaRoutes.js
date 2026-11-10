import { Router } from "express";
import * as cajaController from "../controllers/cajaController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

// GET /api/caja/estado — Obtener el estado actual de la caja
router.get("/estado", verifyToken, cajaController.getEstadoCaja);
router.post("/apertura", verifyToken, cajaController.aperturaCaja);
router.put("/cierre/:id", verifyToken, cajaController.cierreCaja);

export default router;
