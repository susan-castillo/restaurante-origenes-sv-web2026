import { prisma } from '../models/db.js';

// Consulta si existe una apertura de caja activa (sin fecha de cierre o con estado ABIERTA)
export const getEstadoCaja = async (sucursalId) => {
    const cajaActiva = await prisma.turnos_caja.findFirst({
        where: {
            sucursal_id: sucursalId,
            estado: 'ABIERTO',
            cerrado_en: null
        },
        select: {
            id: true,
            sucursal_id: true,
            usuario_id: true,
            monto_inicial: true,
            abierto_en: true,
            estado: true
        }
    });

    return {
        abierta: !!cajaActiva,
        caja: cajaActiva || null
    };
};