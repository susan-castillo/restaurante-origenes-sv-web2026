import express from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import posRoutes from "./routes/posRoutes.js";
import proveedorRoutes from "./routes/proveedorRoutes.js";
import inventarioRoutes from "./routes/inventarioRoutes.js";
import sucursalRoutes from "./routes/sucursalRoutes.js";
import cajaRoutes from "./routes/cajaRoutes.js";
import comprasRoutes from "./routes/comprasRoutes.js";
import rrhhRoutes from "./routes/rrhhRoutes.js";
import nominaRoutes from "./routes/nominaRoutes.js";

const app = express();

// Confiar en el primer proxy (PHP API Gateway) para leer la IP real del cliente en X-Forwarded-For
app.set("trust proxy", 1);

// Deshabilitar el encabezado 'x-powered-by' por motivos de seguridad
app.disable("x-powered-by");

const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.CORS_ORIGIN,
].filter(Boolean);

// Configuración de CORS para permitir peticiones desde el origen del Frontend (Vite)
app.use(
    cors({
        origin: function (origin, callback) {
            // Permitir peticiones sin origen (como el Gateway PHP, Postman o del mismo servidor)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Bloqueado por política de CORS"));
            }
        },
        credentials: true,
    }),
);

// Middleware de seguridad Helmet para configurar cabeceras HTTP seguras
app.use(helmet());

// Parseo del cuerpo de las peticiones en formato JSON con límite de tamaño de 10kb
app.use(express.json({ limit: "10kb" }));

// Middleware de seguridad: exigir que toda petición a /api provenga del Gateway PHP autorizado
app.use("/api", (req, res, next) => {
    const expectedToken = process.env.INTERNAL_GATEWAY_TOKEN?.trim();

    if (!expectedToken) {
        console.error("FATAL: INTERNAL_GATEWAY_TOKEN no está definido en el .env del backend.");
        return res.status(500).json({ error: "Error de configuración del servidor." });
    }

    const incomingToken = req.headers["x-gateway-token"];
    if (!incomingToken || incomingToken !== expectedToken) {
        return res.status(403).json({
            error: "Acceso directo no permitido. Las peticiones deben pasar por el API Gateway.",
        });
    }

    next();
});

// Limitador de tasa (Rate Limiting) general por IP real del cliente en la API
app.use(
    "/api",
    rateLimit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900_000), // 15 minutos por defecto
        limit: Number(process.env.RATE_LIMIT_MAX || 500), // Máximo 500 peticiones por IP y ventana
        standardHeaders: "draft-8",
        legacyHeaders: false,
    }),
);

// ----------------------------------------------------
// RUTAS DE LA APLICACIÓN
// ----------------------------------------------------

// Rutas del módulo de autenticación (/api/auth/login, /api/auth/me)
app.use("/api/auth", authRoutes);

app.use("/api/pos", posRoutes);

app.use("/api/proveedores", proveedorRoutes);

// Rutas del módulo de Inventario/Recetas
app.use("/api", inventarioRoutes);

// Rutas del módulo de sucursales
app.use("/api/sucursales", sucursalRoutes);

// Rutas del módulo de caja
app.use("/api/caja", cajaRoutes);

// Rutas del módulo de compras e inventario
app.use("/api/compras", comprasRoutes);

// Rutas del módulo de RRHH y Nómina
app.use("/api/rrhh", rrhhRoutes);
app.use("/api/nomina", nominaRoutes);

// ----------------------------------------------------
// MIDDLEWARES DE MANEJO DE ERRORES Y RUTAS NO ENCONTRADAS
// ----------------------------------------------------

// Middleware para capturar peticiones a rutas no existentes (404 Not Found)
app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
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
        console.error("Error interno del servidor:", error);
    }

    res.status(statusCode).json({
        error:
            statusCode === 500 ? "Error interno del servidor" : "Petición inválida",
    });
});

export default app;