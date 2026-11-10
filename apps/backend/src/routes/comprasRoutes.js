import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import {
  crearCompra,
  getResumenCostos,
} from "../controllers/comprasController.js";

const router = Router();

router.post("/", verifyToken, crearCompra);
router.get("/resumen", verifyToken, getResumenCostos);

export default router;
