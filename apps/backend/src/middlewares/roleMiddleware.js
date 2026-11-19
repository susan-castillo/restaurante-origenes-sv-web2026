// Restringe una ruta a ciertos roles. Debe ir después de verifyToken.
export const requireRole = (...roles) => (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción.' });
    }
    next();
};

// Deja pasar a cualquier ADMIN (central o de sede) y a los EMPLEADO con cargo BARISTA.
// Debe ir después de cargarAccesoSucursales, que es quien trae el cargo vigente.
export const requireAdminOBarista = (req, res, next) => {
    const { rol, cargo } = req.usuario ?? {};
    const esAdmin = rol === 'ADMIN';
    const esBarista = rol === 'EMPLEADO' && cargo === 'BARISTA';
    if (!esAdmin && !esBarista) {
        return res.status(403).json({ error: 'No tienes permiso para realizar esta acción.' });
    }
    next();
};