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
  return prisma.$transaction(async (tx) => {
    const turnoActivo = await tx.turnos_caja.findFirst({
      where: { sucursal_id: sucursalId, usuario_id: usuarioId, estado: "ABIERTO", cerrado_en: null },
    });
    if (turnoActivo) throw new Error("TURNO_YA_ABIERTO");

    return tx.turnos_caja.create({
      data: {
        sucursal_id: sucursalId,
        usuario_id: usuarioId,
        monto_inicial: montoInicial,
        estado: "ABIERTO",
      },
    });
  }, { isolationLevel: "Serializable" });
}

export async function cierreCaja(idTurno, efectivoContado, usuarioId, sucursalId) {
  return prisma.$transaction(async (tx) => {
    const alcance = { id: idTurno, usuario_id: usuarioId, sucursal_id: sucursalId };
    const cambio = await tx.turnos_caja.updateMany({
      where: { ...alcance, estado: "ABIERTO", cerrado_en: null },
      data: { estado: "CERRADO", cerrado_en: new Date(), efectivo_contado: efectivoContado },
    });
    const turno = await tx.turnos_caja.findFirst({ where: alcance });
    if (!turno) throw new Error("TURNO_NO_ENCONTRADO");
    // Si se perdió la respuesta, repetir el mismo importe recupera el cuadre original.
    if (!cambio.count && (turno.estado !== "CERRADO" || turno.efectivo_contado === null
      || Number(turno.efectivo_contado) !== efectivoContado)) {
      throw new Error("TURNO_YA_CERRADO");
    }
    return { turno, reporte: await calcularCuadre(idTurno, tx) };
  });
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

export async function calcularCuadre(turnoId, cliente = prisma) {
  // Obtener informacion del turno
  const turno = await cliente.turnos_caja.findUnique({
    where: { id: turnoId },
  });

  if (!turno) {
    throw new Error("El turno especificado no existe");
  }

  // Obtenemos todas las ventas de este turno
  const ventas = await cliente.ventas.findMany({
    where: { turno_id: turnoId },
  });

  let totalEfectivo = 0;
  let totalTarjeta = 0;
  let totalBitcoin = 0;

  ventas.forEach((venta) => {
    const monto = Math.round(Number(venta.total) * 100);

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
  const efectivoEsperado = Math.round(montoInicial * 100) + totalEfectivo;

  const efectivoContado =
    turno.efectivo_contado !== null ? Number(turno.efectivo_contado) : null;

  const diferencia =
    efectivoContado !== null ? (Math.round(efectivoContado * 100) - efectivoEsperado) / 100 : null;

  return {
    turno_id: turnoId,
    monto_inicial: montoInicial,
    ventas: {
      efectivo: totalEfectivo / 100,
      tarjeta: totalTarjeta / 100,
      bitcoin: totalBitcoin / 100,
      total_general: (totalEfectivo + totalTarjeta + totalBitcoin) / 100,
    },
    cuadre_efectivo: {
      esperado_en_caja: efectivoEsperado / 100,
      reportado_por_cajero: efectivoContado,
      diferencia: diferencia,
    },
  };
}
