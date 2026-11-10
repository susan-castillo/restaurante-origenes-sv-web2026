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

      await tx.inventario_sucursal.updateMany({
        where: {
          sucursal_id: sucursalId,
          insumo_id: item.insumo_id,
        },
        data: {
          stock_actual: { increment: item.cantidad },
        },
      });
    }

    return nuevaCompra;
  });
  return compraRegistrada;
}
