import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar la validez del token JWT en peticiones protegidas.
 * Se encarga de extraer el encabezado Authorization, validar la firma del token
 * y adjuntar los datos del usuario a la petición (req.usuario).
 */
export const verifyToken = (req, res, next) => {
    // 1. Obtener el encabezado de autorización de la petición HTTP
    const authHeader = req.headers.authorization;

    // 2. Validar que el encabezado exista y cumpla con el formato 'Bearer <token>'
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso no autorizado. Token faltante.' });
    }

    // 3. Extraer únicamente la cadena del token (después de la palabra 'Bearer ')
    const token = authHeader.split(' ')[1];

    try {
        // 4. Verificar la firma y vigencia del token usando la clave secreta
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // 5. Adjuntar la información decodificada del usuario al objeto de la petición
        req.usuario = decoded;

        // 6. Continuar con la ejecución de la siguiente función o controlador
        next();
    } catch (error) {
        // 7. Si el token expiró o fue alterado, retornar estado HTTP 401
        return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};