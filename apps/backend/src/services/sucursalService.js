import { prisma } from "../models/db.js";
import { esAdminCentral } from "../middlewares/sucursalAccess.js";

export const getSucursales = async (usuario, incluirInactivas = false) => {
  const central = esAdminCentral(usuario);
  if (!central && !usuario.sucursal_id) {
    return [];
  }

  const where = central ? {} : { id: usuario.sucursal_id };
  if (!incluirInactivas || usuario.rol !== "ADMIN") {
    where.activa = true;
  }

  return prisma.sucursales.findMany({
    where,
    select: { id: true, nombre: true, direccion: true, activa: true },
    orderBy: { nombre: "asc" },
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

export async function actualizarSucursal(id, { nombre, direccion, activa }) {
  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (direccion !== undefined) data.direccion = direccion || null;
  if (activa !== undefined) data.activa = activa;

  const sucursalActualizada = await prisma.sucursales.update({
    where: { id: id },
    data,
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

export async function obtenerEstadisticasDashboard() {
  const sucursales = await prisma.sucursales.findMany({
    where: { activa: true },
    select: { id: true, nombre: true },
  });

  let totalGlobalVentas = 0;
  let totalGlobalCompras = 0;

  // Iteramos para sacar la sumatoria de ventas y compras por sucursal
  const rendimientoSucursales = await Promise.all(
    sucursales.map(async (sucursal) => {
      // Sumar todas las compras asociadas a esta sucursal
      const compras = await prisma.compras.aggregate({
        where: { sucursal_id: sucursal.id },
        _sum: { total: true },
      });

      // Sumar todas las ventas
      const ventas = await prisma.ventas.aggregate({
        where: { sucursal_id: sucursal.id },
        _sum: { total: true },
      });

      const totalVentas = Number(ventas._sum.total || 0);
      const totalCompras = Number(compras._sum.total || 0);

      totalGlobalVentas += totalVentas;
      totalGlobalCompras += totalCompras;

      return {
        nombre: sucursal.nombre,
        ventas: totalVentas,
        compras: totalCompras,
        rentabilidad: totalVentas - totalCompras,
      };
    }),
  );

  return {
    tarjetas_superiores: {
      sucursales_activas: sucursales.length,
      ingresos_totales: totalGlobalVentas,
      gastos_totales: totalGlobalCompras,
      ganancia_neta: totalGlobalVentas - totalGlobalCompras,
    },
    grafico_rendimiento: rendimientoSucursales,
  };
}
