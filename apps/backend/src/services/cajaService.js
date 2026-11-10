import { prisma } from "../models/db.js";

// Consulta si existe una apertura de caja activa (sin fecha de cierre o con estado ABIERTA)
export const getEstadoCaja = async (sucursalId) => {
  const cajaActiva = await prisma.turnos_caja.findFirst({
    where: {
      sucursal_id: sucursalId,
      estado: "ABIERTO",
      cerrado_en: null,
    },
    select: {
      id: true,
      sucursal_id: true,
      usuario_id: true,
      monto_inicial: true,
      abierto_en: true,
      estado: true,
    },
  });

  return {
    abierta: !!cajaActiva,
    caja: cajaActiva || null,
  };
};

export async function aperturaCaja(sucursalId, usuarioId, montoInicial) {
  const turnoActivo = await prisma.turnos_caja.findFirst({
    where: {
      sucursal_id: sucursalId,
      usuario_id: usuarioId,
      estado: "ABIERTO",
    },
  });

  // Verificamos si hay turno activo
  if (turnoActivo) {
    throw new Error(
      "El usuario ya tiene un turno de caja abierto en esta sucursal",
    );
  }

  const nuevoTurno = await prisma.turnos_caja.create({
    data: {
      sucursal_id: sucursalId,
      usuario_id: usuarioId,
      monto_inicial: montoInicial,
      estado: "ABIERTO",
    },
  });
  return nuevoTurno;
}

export async function cierreCaja(idTurno, efectivoContado) {
  const turnoActualizado = await prisma.turnos_caja.update({
    where: {
      id: idTurno,
    },
    data: {
      estado: "CERRADO",
      cerrado_en: new Date(), // Ponemos hora y fecha exacta del cierre
      efectivo_contado: efectivoContado,
    },
  });
  return turnoActualizado;
}

export async function obtenerTurnoAbierto(sucursalId, usuarioId) {
  const turno = await prisma.turnos_caja.findFirst({
    where: {
      sucursal_id: sucursalId,
      usuario_id: usuarioId,
      estado: "ABIERTO",
      cerrado_en: null,
    },
  });

  return turno;
}

export async function calcularCuadre(turnoId) {
  // Obtener informacion del turno
  const turno = await prisma.turnos_caja.findUnique({
    where: { id: turnoId },
  });

  if (!turno) {
    throw new Error("El turno especificado no existe");
  }

  // Obtenemos todas las ventas de este turno
  const ventas = await prisma.ventas.findMany({
    where: { turno_id: turnoId },
  });

  let totalEfectivo = 0;
  let totalTarjeta = 0;
  let totalBitcoin = 0;

  ventas.forEach((venta) => {
    const monto = Number(venta.total);

    if (venta.metodo_pago === "EFECTIVO") {
      totalEfectivo += monto;
    }

    if (venta.metodo_pago === "TARJETA") {
      totalTarjeta += monto;
    }

    if (venta.metodo_pago === "BITCOIN") {
      totalBitcoin += monto;
    }
  });

  // Calculamos el total general esperado (total efectivo + fondo_inicial) (lo que hay en la caja fisicamente)
  const montoInicial = Number(turno.monto_inicial);
  const efectivoEsperado = montoInicial + totalEfectivo;

  const efectivoContado =
    turno.efectivo_contado !== null ? Number(turno.efectivo_contado) : null;

  const diferencia =
    efectivoContado !== null ? efectivoContado - efectivoEsperado : null;

  return {
    turno_id: turnoId,
    monto_inicial: montoInicial,
    ventas: {
      efectivo: totalEfectivo,
      tarjeta: totalTarjeta,
      bitcoin: totalBitcoin,
      total_general: totalEfectivo + totalTarjeta + totalBitcoin,
    },
    cuadre_efectivo: {
      esperado_en_caja: efectivoEsperado,
      reportado_por_cajero: efectivoContado,
      diferencia: diferencia,
    },
  };
}
