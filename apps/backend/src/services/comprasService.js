import prisma from "../models/db.js";

export async function registrarCompra(
  sucursalId,
  proveedorId,
  numeroFactura,
  fechaVencimiento,
  detalles,
) {
  // Calculamos el total de la factura sumando cantidad * costo
  const totalFactura = detalles.reduce(
    (suma, item) => suma + item.cantidad * item.costo_unitario,
    0,
  );

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
  // Buscamos las compras en ese rango de fechas
  // Aseguramos que el inicio sea a las 00:00:00 y el fin a las 23:59:59

  const inicio = new Date(fechaInicio);
  const fin = new Date(`${fechaFinal}T23:59:59.999Z`);

  const compras = await prisma.compras.findMany({
    where: {
      ...(sucursalId !== null && { sucursal_id: sucursalId }),
      creado_en: {
        gte: inicio,
        lte: fin,
      },
    },
  });

  let totalPagado = 0;
  let totalPendiente = 0;

  // Clasificamos y sumamos
  compras.forEach((compra) => {
    const monto = Number(compra.total);

    if (compra.estado_pago === "PAGADA") {
      totalPagado += monto;
    } else if (compra.estado_pago === "PENDIENTE") {
      totalPendiente += monto;
    }
  });

  return {
    rango: {
      inicio: fechaInicio,
      fin: fechaFinal,
    },
    resumen: {
      gastos_totales: totalPagado + totalPendiente,
      total_pagado: totalPagado,
      cuentas_por_pagar: totalPendiente,
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
