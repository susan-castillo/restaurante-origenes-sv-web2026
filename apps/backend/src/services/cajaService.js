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
    select: { metodo_pago: true, total: true },
  });

  return armarCuadre(turno, ventas);
}

function armarCuadre(turno, ventas) {
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
    turno_id: turno.id,
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

export async function listarHistorialCaja({ sucursalId, cerradoEn, cursor }) {
  const limite = 20;
  const turnos = await prisma.turnos_caja.findMany({
    where: {
      estado: "CERRADO",
      cerrado_en: { not: null, ...cerradoEn },
      ...(sucursalId !== null && { sucursal_id: sucursalId }),
      ...(cursor !== null && { id: { lt: cursor } }),
    },
    orderBy: { id: "desc" },
    take: limite + 1,
    select: {
      id: true, abierto_en: true, cerrado_en: true, monto_inicial: true, efectivo_contado: true,
      sucursales: { select: { nombre: true } },
      usuarios: { select: { nombre: true } },
    },
  });
  const pagina = turnos.slice(0, limite);
  if (!pagina.length) return { turnos: [], siguiente: null };

  const ventas = await prisma.ventas.groupBy({
    by: ["turno_id", "metodo_pago"],
    where: { turno_id: { in: pagina.map((turno) => turno.id) } },
    _sum: { total: true },
  });
  const ventasPorTurno = new Map();
  for (const venta of ventas) {
    const grupos = ventasPorTurno.get(venta.turno_id) ?? [];
    grupos.push({ metodo_pago: venta.metodo_pago, total: venta._sum.total });
    ventasPorTurno.set(venta.turno_id, grupos);
  }

  return {
    turnos: pagina.map((turno) => ({
      id: turno.id,
      sucursal: turno.sucursales.nombre,
      cajero: turno.usuarios.nombre,
      abierto_en: turno.abierto_en,
      cerrado_en: turno.cerrado_en,
      ...armarCuadre(turno, ventasPorTurno.get(turno.id) ?? []),
    })),
    siguiente: turnos.length > limite ? pagina.at(-1).id : null,
  };
}
