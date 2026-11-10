import { Router } from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { crearCompra } from "../controllers/comprasController.js";

const router = Router();

router.post("/", verifyToken, crearCompra);

export default router;
