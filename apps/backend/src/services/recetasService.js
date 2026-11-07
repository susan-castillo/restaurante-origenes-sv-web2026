// Lógica de negocio de las recetas de los platillos (comunicación con Prisma).
import { prisma } from '../models/db.js';

// Devuelve la receta de un platillo con el nombre y la unidad de cada insumo.
export const obtenerReceta = async (platilloId) => {
    const platillo = await prisma.platillos.findUnique({
        where: { id: platilloId },
        include: {
            recetas: { include: { insumos: true }, orderBy: { insumo_id: 'asc' } },
        },
    });
    if (!platillo) throw new Error('PLATILLO_NO_ENCONTRADO');

    return {
        platillo_id: platillo.id,
        items: platillo.recetas.map((r) => ({
            insumo_id: r.insumo_id,
            nombre: r.insumos.nombre,
            unidad: r.insumos.unidad,
            cantidad: r.cantidad,
        })),
    };
};

// Reemplaza la receta completa de un platillo dentro de una transacción.
export const reemplazarReceta = async (platilloId, items) => {
    await prisma.$transaction(async (tx) => {
        const platillo = await tx.platillos.findUnique({ where: { id: platilloId } });
        if (!platillo) throw new Error('PLATILLO_NO_ENCONTRADO');

        // Todos los insumos enviados deben existir
        const ids = items.map((item) => item.insumo_id);
        const existentes = await tx.insumos.count({ where: { id: { in: ids } } });
        if (existentes !== ids.length) throw new Error('INSUMO_NO_ENCONTRADO');

        await tx.recetas.deleteMany({ where: { platillo_id: platilloId } });
        if (items.length > 0) {
            await tx.recetas.createMany({
                data: items.map((item) => ({
                    platillo_id: platilloId,
                    insumo_id: item.insumo_id,
                    cantidad: item.cantidad,
                })),
            });
        }
    });

    return obtenerReceta(platilloId);
};