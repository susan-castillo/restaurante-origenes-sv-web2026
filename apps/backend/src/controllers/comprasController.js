import * as comprasService from "../services/comprasService.js";
import * as sucursalService from "../services/sucursalService.js";
import { esAdminCentral } from "../middlewares/sucursalAccess.js";

export async function crearCompra(req, res) {
  const { sucursal_id, proveedor_id, numero_factura, fecha_vencimiento, detalles } =
      req.body;

  // Si es Admin Central (sucursal_id null en token), toma la sucursal enviada en el body
  const sucursalId = esAdminCentral(req.usuario)
      ? Number(sucursal_id)
      : req.usuario?.sucursal_id;

  if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
    return res
        .status(403)
        .json({ error: "No se encontró una sucursal válida para registrar la compra." });
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
  const { fecha_inicio, fecha_fin, sucursal_id } = req.query;

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

  // Si es Admin Central y eligió una sucursal en el Navbar, filtra por esa (o null si quiere todas)
  const sucursalFiltro = esAdminCentral(req.usuario)
      ? (sucursal_id ? Number(sucursal_id) : null)
      : req.usuario.sucursal_id;

  try {
    const resumen = await comprasService.obtenerResumenCostos(
        fecha_inicio,
        fecha_fin,
        sucursalFiltro,
    );
    return res.json(resumen);
  } catch (error) {
    console.error(error);
    return res
        .status(500)
        .json({ error: "Error interno al generar el resumen de costos" });
  }
}

export async function getCompras(req, res) {
  const { sucursal_id } = req.query;
  const sucursalFiltro = esAdminCentral(req.usuario)
      ? (sucursal_id ? Number(sucursal_id) : null)
      : req.usuario.sucursal_id;

  try {
    const compras = await comprasService.listarCompras(sucursalFiltro);
    return res.json(compras);
  } catch (error) {
    console.error(error);
    return res
        .status(500)
        .json({ error: "Error interno al obtener el historial de compras" });
  }
}

export async function marcarCompraPagada(req, res) {
  const compraId = Number(req.params.id);

  if (!Number.isInteger(compraId) || compraId <= 0) {
    return res.status(400).json({ error: "ID de compra inválido." });
  }

  const sucursalRestriccion = esAdminCentral(req.usuario)
      ? null
      : req.usuario.sucursal_id;

  try {
    const compra = await comprasService.pagarCompra(compraId, sucursalRestriccion);
    return res.json({
      mensaje: "Factura marcada como pagada exitosamente.",
      compra,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error(error);
    return res
        .status(500)
        .json({ error: "Error interno al registrar el pago de la factura" });
  }
}