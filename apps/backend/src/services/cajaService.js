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

