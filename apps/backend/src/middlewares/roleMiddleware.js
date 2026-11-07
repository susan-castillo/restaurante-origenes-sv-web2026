// Restringe una ruta a ciertos roles. Debe ir después de verifyToken.
export const requireRole = (...roles) => (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción.' });
    }
    next();
};