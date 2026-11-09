import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import posRoutes from './routes/posRoutes.js';
import inventarioRoutes from './routes/inventarioRoutes.js';
import sucursalRoutes from "./routes/sucursalRoutes.js";
import cajaRoutes from "./routes/cajaRoutes.js";

const app = express();

// Deshabilitar el encabezado 'x-powered-by' por motivos de seguridad
app.disable('x-powered-by');

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.CORS_ORIGIN
].filter(Boolean);

// Configuración de CORS para permitir peticiones desde el origen del Frontend (Vite)
app.use(cors({
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (como Postman o del mismo servidor)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Bloqueado por política de CORS'));
        }
    },
    credentials: true
}));

// Middleware de seguridad Helmet para configurar cabeceras HTTP seguras
app.use(helmet());

// Parseo del cuerpo de las peticiones en formato JSON con límite de tamaño de 10kb
app.use(express.json({ limit: '10kb' }));

// Limitador de tasa (Rate Limiting) para prevenir ataques de fuerza bruta en la API
app.use(
    '/api',
    rateLimit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900_000), // 15 minutos por defecto
        limit: Number(process.env.RATE_LIMIT_MAX || 500),              // Máximo 100 peticiones por ventana
        standardHeaders: 'draft-8',
        legacyHeaders: false,
    })
);

// ----------------------------------------------------
// RUTAS DE LA APLICACIÓN
// ----------------------------------------------------

// Rutas del módulo de autenticación (/api/auth/login, /api/auth/me)
app.use('/api/auth', authRoutes);

app.use('/api/pos', posRoutes);

// Rutas del módulo de Inventario/Recetas
app.use('/api', inventarioRoutes);

// Rutas del módulo de sucursales
app.use('/api/sucursales', sucursalRoutes);

// Rutas del módulo de caja
app.use('/api/caja', cajaRoutes);
// ----------------------------------------------------
// MIDDLEWARES DE MANEJO DE ERRORES Y RUTAS NO ENCONTRADAS
// ----------------------------------------------------

// Middleware para capturar peticiones a rutas no existentes (404 Not Found)
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Middleware global para el tratamiento centralizado de errores (500 / 4xx)
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    const statusCode =
        Number.isInteger(error.status) && error.status >= 400 && error.status < 500
            ? error.status
            : 500;

    if (statusCode === 500) {
        console.error('Error interno del servidor:', error);
    }

    res.status(statusCode).json({
        error: statusCode === 500 ? 'Error interno del servidor' : 'Petición inválida',
    });
});

export default app;