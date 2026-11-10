import * as comprasService from "../services/comprasService.js";

export async function crearCompra(req, res) {
  const sucursalId = req.usuario?.sucursal_id;
  const { proveedor_id, numero_factura, fecha_vencimiento, detalles } =
    req.body;

  if (!sucursalId) {
    return res
      .status(403)
      .json({ error: "No se encontro sucursal en el token" });
  }

  const idProveedor = Number(proveedor_id);

  if (!Number.isInteger(idProveedor) || idProveedor <= 0 || !numero_factura) {
    return res
      .status(400)
      .json({ error: "Datos de proveedor o factura son invalidos" });
  }

  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({
      error: "La compra debe incluir almenos un insumo en 'detalles'.",
    });
  }

  // Validamos que cada insumo del arreglo traiga numeros validos
  for (const item of detalles) {
    if (
      isNaN(item.insumo_id) ||
      isNaN(item.cantidad) ||
      isNaN(item.costo_unitario) ||
      item.cantidad <= 0
    ) {
      return res.status(400).json({
        error: "Uno de los productos tiene datos numéricos inválidos.",
      });
    }
  }

  try {
    const compra = await comprasService.registrarCompra(
      sucursalId,
      idProveedor,
      numero_factura,
      fecha_vencimiento,
      detalles,
    );

    return res.status(201).json({
      mensaje: "Compra registrada e inventario actualizado con exito!",
      compra,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error interno al registrar la compra" });
  }
}
