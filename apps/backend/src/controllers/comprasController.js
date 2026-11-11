import * as comprasService from "../services/comprasService.js";
import * as sucursalService from "../services/sucursalService.js";

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
    const sucursalInfo = await sucursalService.obtenerSucursalPorId(sucursalId);

    if (!sucursalInfo) {
      return res
        .status(404)
        .json({ error: "La sucursal especificada no existe." });
    }

    if (sucursalInfo.activa === false) {
      return res.status(403).json({
        error:
          "Acceso denegado: No se pueden registrar compras en una sucursal inactiva",
      });
    }

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

export async function getResumenCostos(req, res) {
  const { fecha_inicio, fecha_fin } = req.query;

  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({
      error:
        "Debes proporcionar una fecha_inicio y fecha_fin en los parametros de la URL",
    });
  }

  if (isNaN(Date.parse(fecha_inicio)) || isNaN(Date.parse(fecha_fin))) {
    return res.status(400).json({
      error:
        "Las fechas proporcionadas no tienen un formato valido (usa YYYY-MM-DD)",
    });
  }

  try {
    const resumen = await comprasService.obtenerResumenCostos(
      fecha_inicio,
      fecha_fin,
    );
    return res.json(resumen);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error interno al generar el resumen de costos" });
  }
}
