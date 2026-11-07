// Lógica de negocio del inventario por sucursal (comunicación con Prisma).
import { prisma } from '../models/db.js';

// Stock de una sucursal: todos los insumos del catálogo, con 0 si aún no tienen fila de inventario.
export const listarInventario = async (sucursalId) => {
    const insumos = await prisma.insumos.findMany({
        orderBy: { nombre: 'asc' },
        include: { inventario_sucursal: { where: { sucursal_id: sucursalId } } },
    });

    return insumos.map((insumo) => {
        const fila = insumo.inventario_sucursal[0];
        return {
            insumo_id: insumo.id,
            nombre: insumo.nombre,
            unidad: insumo.unidad,
            stock_actual: fila ? fila.stock_actual : '0',
            stock_minimo: fila ? fila.stock_minimo : '0',
        };
    });
};

// Insumos cuyo stock actual está por debajo del mínimo en una sucursal.
// Prisma no compara dos columnas entre sí en un where, así que se filtra aquí con Decimal.
export const listarAlertas = async (sucursalId) => {
    const filas = await prisma.inventario_sucursal.findMany({
        where: { sucursal_id: sucursalId },
        include: { insumos: true },
        orderBy: { insumo_id: 'asc' },
    });

    return filas
        .filter((fila) => fila.stock_actual.lt(fila.stock_minimo))
        .map((fila) => ({
            insumo_id: fila.insumo_id,
            nombre: fila.insumos.nombre,
            unidad: fila.insumos.unidad,
            stock_actual: fila.stock_actual,
            stock_minimo: fila.stock_minimo,
            faltante: fila.stock_minimo.minus(fila.stock_actual),
        }));
};

// Ajusta stock_actual y/o stock_minimo. Si la fila no existe, la crea (lo no enviado queda en 0).
export const ajustarInventario = async (sucursalId, insumoId, datos) => {
    const [sucursal, insumo] = await Promise.all([
        prisma.sucursales.findUnique({ where: { id: sucursalId } }),
        prisma.insumos.findUnique({ where: { id: insumoId } }),
    ]);
    if (!sucursal) throw new Error('SUCURSAL_NO_ENCONTRADA');
    if (!insumo) throw new Error('INSUMO_NO_ENCONTRADO');

    const fila = await prisma.inventario_sucursal.upsert({
        where: { sucursal_id_insumo_id: { sucursal_id: sucursalId, insumo_id: insumoId } },
        update: datos,
        create: { sucursal_id: sucursalId, insumo_id: insumoId, ...datos },
    });

    return {
        insumo_id: insumo.id,
        nombre: insumo.nombre,
        unidad: insumo.unidad,
        stock_actual: fila.stock_actual,
        stock_minimo: fila.stock_minimo,
    };
};