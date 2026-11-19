import { Prisma } from "@prisma/client";
import { prepararCompra } from "../utils/compraImportes.js";
import { rangoFechasSV } from "../utils/fechaSV.js";
import prisma from "../models/db.js";

export async function registrarCompra(
  sucursalId,
  proveedorId,
  numeroFactura,
  fechaVencimiento,
  detalles,
) {
  const preparados = prepararCompra(detalles);
  const totalFactura = preparados.total;
  detalles = preparados.filas;
  numeroFactura = numeroFactura.trim();

  // Ejecutamos todo dentro de una transaccion

  const compraRegistrada = await prisma.$transaction(async (tx) => {
    // Creamos la cabecera de la compra (Cuenta por pagar)

    const nuevaCompra = await tx.compras.create({
      data: {
        sucursal_id: sucursalId,
        proveedor_id: proveedorId,
        numero_factura: numeroFactura,
        total: totalFactura,
        estado_pago: "PENDIENTE",
        fecha_vencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
      },
    });

    // Iteramos sobre arreglo de producto para insertar detalles y subir stock

    for (const item of detalles) {
      await tx.detalle_compra.create({
        data: {
          compra_id: nuevaCompra.id,
          insumo_id: item.insumo_id,
          cantidad: item.cantidad,
          costo_unitario: item.costo_unitario,
        },
      });

      await tx.inventario_sucursal.upsert({
        where: {
          sucursal_id_insumo_id: {
            sucursal_id: sucursalId,
            insumo_id: item.insumo_id,
          },
        },
        create: {
          sucursal_id: sucursalId,
          insumo_id: item.insumo_id,
          stock_actual: item.cantidad,
        },
        update: {
          stock_actual: { increment: item.cantidad },
        },
      });
    }

    return nuevaCompra;
  });
  return compraRegistrada;
}

export async function obtenerResumenCostos(fechaInicio, fechaFinal, sucursalId) {
  const { inicio, fin } = rangoFechasSV(fechaInicio, fechaFinal);

  const compras = await prisma.compras.findMany({
    where: {
      ...(sucursalId !== null && { sucursal_id: sucursalId }),
      creado_en: {
        gte: inicio,
        lt: fin,
      },
    },
  });

  let totalPagado = new Prisma.Decimal(0);
  let totalPendiente = new Prisma.Decimal(0);

  // Clasificamos y sumamos
  compras.forEach((compra) => {
    const monto = new Prisma.Decimal(compra.total);

    if (compra.estado_pago === "PAGADA") {
      totalPagado = totalPagado.plus(monto);
    } else if (compra.estado_pago === "PENDIENTE") {
      totalPendiente = totalPendiente.plus(monto);
    }
  });

  return {
    rango: {
      inicio: fechaInicio,
      fin: fechaFinal,
    },
    resumen: {
      gastos_totales: totalPagado.plus(totalPendiente).toNumber(),
      total_pagado: totalPagado.toNumber(),
      cuentas_por_pagar: totalPendiente.toNumber(),
    },
    cantidad_transacciones: compras.length,
  };
}

// Listar facturas de compra (filtradas por sucursal si aplica)
export async function listarCompras(sucursalId = null) {
  return prisma.compras.findMany({
    where: {
      ...(sucursalId ? {sucursal_id: Number(sucursalId)} : {}),
    },
    include: {
      proveedores: {select: {id: true, nombre: true, nit: true}},
      sucursales: {select: {id: true, nombre: true}},
    },
    orderBy: [
      {estado_pago: "desc"}, // Muestra primero las 'PENDIENTE' antes que 'PAGADA'
      {creado_en: "desc"},
    ],
  });
}

// Marcar una factura como PAGADA
export async function pagarCompra(compraId, sucursalId = null) {
  const compra = await prisma.compras.findUnique({
    where: { id: Number(compraId) },
  });

  if (!compra) {
    const err = new Error("La factura de compra no existe.");
    err.status = 404;
    throw err;
  }

  // Si es usuario de sucursal fija, validar que la factura pertenezca a su sucursal
  if (sucursalId && compra.sucursal_id !== Number(sucursalId)) {
    const err = new Error("No tienes permiso para pagar facturas de otra sucursal.");
    err.status = 403;
    throw err;
  }

  if (compra.estado_pago === "PAGADA") {
    const err = new Error("Esta factura ya se encuentra pagada.");
    err.status = 400;
    throw err;
  }

  return prisma.compras.update({
    where: {id: Number(compraId)},
    data: {
      estado_pago: "PAGADA",
      fecha_pago: new Date(),
    },
  });
}
