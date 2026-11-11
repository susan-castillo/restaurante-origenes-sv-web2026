import * as cajaService from "../services/cajaService.js";
import * as sucursalService from "../services/sucursalService.js";

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

export async function aperturaCaja(req, res) {
  const sucursalId = req.query.sucursal_id || req.usuario?.sucursal_id;
  const usuarioId = req.usuario?.id || req.body.usuario_id;
  const monto_inicial = req.body.monto_inicial;

  if (!sucursalId || !usuarioId || monto_inicial === undefined) {
    return res
      .status(400)
      .json({ error: "Faltan datos obligatorios para abrir la caja." });
  }

  const idSucursal = Number(sucursalId);
  const idUsuario = Number(usuarioId);
  const montoInicial = Number(monto_inicial);

  if (!Number.isInteger(idSucursal) || idSucursal <= 0) {
    return res.status(400).json({ error: "El ID de la sucursal es inválido." });
  }

  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    return res.status(400).json({ error: "El ID del usuario es inválido." });
  }

  if (isNaN(montoInicial) || montoInicial < 0) {
    return res
      .status(400)
      .json({ error: "El monto inicial no puede ser negativo." });
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
    return res.status(500).json({ error: "Error interno al abrir la caja." });
  }
}

export async function cierreCaja(req, res) {
  const idTurno = Number(req.params.id);
  const efectivo = Number(req.body.efectivo_contado);

  if (!Number.isInteger(idTurno) || idTurno <= 0) {
    return res.status(400).json({ error: "Id de turno inválido." });
  }

  if (isNaN(efectivo) || efectivo < 0) {
    return res.status(400).json({ error: "El efectivo contado es inválido." });
  }

  try {
    const turnoCerrado = await cajaService.cierreCaja(idTurno, efectivo);

    const reporteCuadre = await cajaService.calcularCuadre(idTurno);

    return res.json({
      mensaje: "Caja cerrada exitosamente",
      turno: turnoCerrado,
      reporte: reporteCuadre,
    });
  } catch (error) {
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
