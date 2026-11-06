import { Router } from 'express';
import { login, getCurrentUser } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Ruta pública para procesar el inicio de sesión del usuario
router.post('/login', login);

// Ruta protegida para obtener la información de la sesión activa del usuario
router.get('/me', verifyToken, getCurrentUser);

export default router;