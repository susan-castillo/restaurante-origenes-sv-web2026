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
