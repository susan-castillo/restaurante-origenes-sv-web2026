import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../utils/jwt.js';
import { prisma } from '../models/db.js';

/**
 * Middleware para verificar la validez del token JWT en peticiones protegidas.
 * Se encarga de extraer el encabezado Authorization, validar la firma del token,
 * revalidar que el usuario siga activo en la base de datos y adjuntar sus datos
 * vigentes a la petición (req.usuario).
 */
export const verifyToken = async (req, res, next) => {
    // 1. Obtener el encabezado de autorización de la petición HTTP
    const authHeader = req.headers.authorization;

    // 2. Validar que el encabezado exista y cumpla con el formato 'Bearer <token>'
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso no autorizado. Token faltante.' });
    }

    // 3. Extraer únicamente la cadena del token (después de la palabra 'Bearer ')
    const token = authHeader.split(' ')[1];

    try {
        // 4. Verificar la firma y vigencia del token usando la misma clave secreta unificada
        const decoded = jwt.verify(token, getJwtSecret());

        // 5. Revalidar en PostgreSQL que el usuario siga activo y traer su sucursal/rol actuales
        const usuarioActual = await prisma.usuarios.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                nombre: true,
                rol: true,
                cargo: true,
                sucursal_id: true,
                activo: true
            }
        });

        if (!usuarioActual || !usuarioActual.activo) {
            return res.status(401).json({ error: 'Usuario desactivado o inexistente.' });
        }

        // 6. Adjuntar la información actualizada del usuario al objeto de la petición
        req.usuario = {
            id: usuarioActual.id,
            nombre: usuarioActual.nombre,
            rol: usuarioActual.rol,
            cargo: usuarioActual.cargo,
            sucursal_id: usuarioActual.sucursal_id
        };

        // 7. Continuar con la ejecución de la siguiente función o controlador
        next();
    } catch (error) {
        // 8. Si el token expiró o fue alterado, retornar estado HTTP 401
        return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};