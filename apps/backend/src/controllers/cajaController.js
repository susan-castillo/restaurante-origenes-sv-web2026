import * as cajaService from "../services/cajaService.js";
import * as sucursalService from "../services/sucursalService.js";
import { esAdminCentral } from "../middlewares/sucursalAccess.js";
import { rangoDiaSV } from "../utils/fechaSV.js";

function enteroPositivo(valor) {
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) return null;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 && numero <= 2147483647 ? numero : null;
}

function fechaValida(fecha) {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const fechaUTC = new Date(`${fecha}T12:00:00Z`);
  return Number.isFinite(fechaUTC.getTime()) && fechaUTC.toISOString().slice(0, 10) === fecha;
}

export async function getHistorialCaja(req, res) {
  const { sucursal_id, fecha_inicio, fecha_fin, antes_de } = req.query;
  const sucursal = sucursal_id === undefined ? null : enteroPositivo(sucursal_id);
  const cursor = antes_de === undefined ? null : enteroPositivo(antes_de);
  if ((sucursal_id !== undefined && sucursal === null) || (antes_de !== undefined && cursor === null)) {
    return res.status(400).json({ error: "La sucursal o la página solicitada no es válida." });
  }

  const central = esAdminCentral(req.usuario);
  if (!central && (!req.usuario.sucursal_id || (sucursal !== null && sucursal !== req.usuario.sucursal_id))) {
    return res.status(403).json({ error: "Solo puedes consultar el historial de tu sede asignada." });
  }

  const cerradoEn = {};
  if (fecha_inicio !== undefined || fecha_fin !== undefined) {
    if (!fechaValida(fecha_inicio) || !fechaValida(fecha_fin) || fecha_inicio > fecha_fin) {
      return res.status(400).json({ error: "Selecciona un rango de fechas válido." });
    }
    cerradoEn.gte = rangoDiaSV(new Date(`${fecha_inicio}T12:00:00Z`)).inicio;
    cerradoEn.lt = rangoDiaSV(new Date(`${fecha_fin}T12:00:00Z`)).fin;
  }

  const historial = await cajaService.listarHistorialCaja({
    sucursalId: central ? sucursal : req.usuario.sucursal_id,
    cerradoEn,
    cursor,
  });
  return res.json(historial);
}

// Controlador para verificar el estado de la caja
export const getEstadoCaja = async (req, res) => {
  try {
    // Se puede recibir sucursal_id por query string o tomar del usuario autenticado (req.usuario)
    const sucursalId = req.query.sucursal_id || req.usuario?.sucursal_id;

    if (!sucursalId) {
      return res
        .status(400)
        .json({ error: "El parámetro sucursal_id es requerido." });
    }

    const estado = await cajaService.getEstadoCaja(Number(sucursalId));
    return res.status(200).json(estado);
  } catch (error) {
    console.error("Error en getEstadoCaja:", error);
    return res
      .status(500)
      .json({ error: "Error al consultar el estado de la caja." });
  }
};

export async function getMiTurno(req, res) {
  const { id, sucursal_id: sucursalId } = req.usuario;
  if (!sucursalId) {
    return res.status(403).json({ error: "Tu cuenta necesita una sucursal asignada." });
  }
  const turno = await cajaService.obtenerTurnoAbierto(sucursalId, id);
  return res.json({ turno });
}

export async function aperturaCaja(req, res) {
  const { id: idUsuario, sucursal_id: idSucursal } = req.usuario;
  const montoInicial = req.body?.monto_inicial;

  if (!idSucursal) {
    return res.status(403).json({ error: "Tu cuenta necesita una sucursal asignada para abrir caja." });
  }
  if (typeof montoInicial !== "number" || !/^\d{1,8}(\.\d{1,2})?$/.test(String(montoInicial))) {
    return res.status(400).json({ error: "Ingresa un monto inicial entre $0.00 y $99,999,999.99, con hasta dos decimales." });
  }

  try {
    const sucursalInfo = await sucursalService.obtenerSucursalPorId(idSucursal);

    if (!sucursalInfo) {
      return res
        .status(404)
        .json({ error: "La sucursal especificada no existe." });
    }

    if (sucursalInfo.activa === false) {
      return res
        .status(403)
        .json({
          error: "Acceso denegado: No se puede abrir una caja inactiva",
        });
    }

    const cajaAbierta = await cajaService.aperturaCaja(
      idSucursal,
      idUsuario,
      montoInicial,
    );

    return res.status(201).json({
      mensaje: "Turno abierto exitosamente!",
      turno: cajaAbierta,
    });
  } catch (error) {
    if (error.message === "TURNO_YA_ABIERTO" || error.code === "P2034") {
      return res.status(409).json({ error: "Ya existe un turno abierto o hay otra apertura en curso. Actualiza el estado de caja." });
    }
    return res.status(500).json({ error: "Error interno al abrir la caja." });
  }
}

export async function cierreCaja(req, res) {
  const idTurno = Number(req.params.id);
  const efectivo = req.body?.efectivo_contado;
  const { id: usuarioId, sucursal_id: sucursalId } = req.usuario;

  if (!Number.isInteger(idTurno) || idTurno <= 0) {
    return res.status(400).json({ error: "Id de turno inválido." });
  }

  if (typeof efectivo !== "number" || !/^\d{1,8}(\.\d{1,2})?$/.test(String(efectivo))) {
    return res.status(400).json({ error: "Ingresa el efectivo contado con hasta dos decimales." });
  }
  if (!sucursalId) {
    return res.status(403).json({ error: "Tu cuenta necesita una sucursal asignada para cerrar caja." });
  }

  try {
    const resultado = await cajaService.cierreCaja(idTurno, efectivo, usuarioId, sucursalId);
    return res.json({ mensaje: "Caja cerrada exitosamente", ...resultado });
  } catch (error) {
    if (error.message === "TURNO_NO_ENCONTRADO") {
      return res.status(404).json({ error: "No se encontró el turno en tu sucursal y cuenta." });
    }
    if (error.message === "TURNO_YA_CERRADO") {
      return res.status(409).json({ error: "El turno ya se cerró con otro monto. Actualiza el estado de caja." });
    }
    return res.status(500).json({ error: "Error interno al cerrar el turno" });
  }
}

export async function getCuadreTurno(req, res) {
  const idTurno = Number(req.params.id);

  if (!Number.isInteger(idTurno) || idTurno < 0) {
    return res.status(400).json({ error: "Id de turno inválido." });
  }

  try {
    const reporte = await cajaService.calcularCuadre(idTurno);

    return res.json(reporte);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Hubo un error interno al calcular el cuadre" });
  }
}
