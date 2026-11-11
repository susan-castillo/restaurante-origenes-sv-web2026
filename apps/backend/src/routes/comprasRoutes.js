import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";
import { cargarAccesoSucursales } from "../middlewares/sucursalAccess.js";
import {
  crearCompra,
  getResumenCostos,
} from "../controllers/comprasController.js";

const router = Router();

const accesoCompras = [verifyToken, cargarAccesoSucursales, requireRole("ADMIN")];
router.post("/", ...accesoCompras, crearCompra);
router.get("/resumen", ...accesoCompras, getResumenCostos);

export default router;
