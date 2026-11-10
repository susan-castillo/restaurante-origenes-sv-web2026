import { prisma } from "../models/db.js";

export const getSucursales = async (usuario, incluirInactivas = false) => {
  // 1. Si es ADMIN o su sucursal_id es null, devuelve TODAS las sucursales activas
  if (usuario.rol === "ADMIN" || !usuario.sucursal_id) {
    const condicionWhere = incluirInactivas ? {} : { activa: true };

    return prisma.sucursales.findMany({
      where: condicionWhere,
      select: { id: true, nombre: true, direccion: true, activa: true },
      orderBy: { nombre: "asc" },
    });
  }

  // 2. Si es EMPLEADO o RRHH asignado a un local específico, devuelve SOLO su sucursal
  return prisma.sucursales.findMany({
    where: {
      id: usuario.sucursal_id,
      activa: true,
    },
    select: { id: true, nombre: true, direccion: true },
  });
};

export async function crearSucursal(nombre, direccion) {
  const nuevaSucursal = await prisma.sucursales.create({
    data: {
      nombre: nombre,
      direccion: direccion || null, // Si no hay direccion entra como null
    },
  });

  return nuevaSucursal;
}

export async function obtenerSucursalPorId(id) {
  const sucursal = await prisma.sucursales.findUnique({
    where: { id: id },
  });

  return sucursal;
}

export async function actualizarSucursal(id, nombre, direccion) {
  const sucursalActualizada = await prisma.sucursales.update({
    where: { id: id },
    data: {
      nombre: nombre !== undefined ? nombre : undefined,
      direccion: direccion !== undefined ? direccion || null : undefined,
    },
  });
  return sucursalActualizada;
}

export async function desactivarSucursal(id) {
  const sucursalDesactivada = await prisma.sucursales.update({
    where: { id: id },
    data: { activa: false },
  });
  return sucursalDesactivada;
}
