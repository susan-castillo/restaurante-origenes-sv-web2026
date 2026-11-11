import { prisma } from "../models/db.js";

export const esAdminCentral = (usuario) =>
  usuario?.rol === "ADMIN" && usuario.sucursal_id === null;

// Lee la asignación vigente aunque el token se haya emitido antes de un cambio.
export async function cargarAccesoSucursales(req, res, next) {
  const id = req.usuario?.id;
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(401).json({ error: "La sesión no identifica a un usuario válido." });
  }

  const usuario = await prisma.usuarios.findUnique({
    where: { id },
    select: { rol: true, sucursal_id: true, activo: true },
  });
  if (!usuario?.activo) {
    return res.status(401).json({ error: "La cuenta no está disponible." });
  }

  req.usuario = { ...req.usuario, ...usuario };
  next();
}

export function requireAdminCentral(req, res, next) {
  if (!esAdminCentral(req.usuario)) {
    return res.status(403).json({ error: "Esta acción requiere acceso de Administración central." });
  }
  next();
}
