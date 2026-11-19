import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { login, getCurrentUser } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Limitador específico para /login (protección contra fuerza bruta por IP)
const loginLimiter = rateLimit({
    windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), // 15 minutos
    limit: Number(process.env.LOGIN_RATE_LIMIT_MAX || 5), // Máximo 5 intentos fallidos por ventana
    skipSuccessfulRequests: true, // No penalizar inicios de sesión exitosos
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        error: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.',
    },
});

// Ruta pública para procesar el inicio de sesión del usuario (con rate limit propio)
router.post('/login', loginLimiter, login);

// Ruta protegida para obtener la información de la sesión activa del usuario
router.get('/me', verifyToken, getCurrentUser);

export default router;