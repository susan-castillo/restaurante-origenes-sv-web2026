// Lógica de negocio del módulo de inventario y recetas (comunicación con Prisma).
import { prisma } from '../models/db.js';

// Devuelve el catálogo de insumos ordenado por nombre.
export const listarInsumos = async () => {
    return prisma.insumos.findMany({ orderBy: { nombre: 'asc' } });
};

// Crea un insumo nuevo. El nombre es único en la base de datos.
export const crearInsumo = async ({ nombre, unidad }) => {
    try {
        return await prisma.insumos.create({ data: { nombre, unidad } });
    } catch (error) {
        // P2002 es el código de Prisma para una violación de campo único
        if (error.code === 'P2002') {
            throw new Error('INSUMO_DUPLICADO');
        }
        throw error;
    }
};

// Actualiza nombre y/o unidad de un insumo.
export const actualizarInsumo = async (id, datos) => {
    try {
        return await prisma.insumos.update({ where: { id }, data: datos });
    } catch (error) {
        // P2025: el registro no existe. P2002: el nombre ya está en uso.
        if (error.code === 'P2025') throw new Error('INSUMO_NO_ENCONTRADO');
        if (error.code === 'P2002') throw new Error('INSUMO_DUPLICADO');
        throw error;
    }
};

// Elimina un insumo. Falla si está en recetas, compras o inventario.
export const eliminarInsumo = async (id) => {
    try {
        return await prisma.insumos.delete({ where: { id } });
    } catch (error) {
        // P2003: otra tabla todavía hace referencia a este insumo.
        if (error.code === 'P2025') throw new Error('INSUMO_NO_ENCONTRADO');
        if (error.code === 'P2003') throw new Error('INSUMO_EN_USO');
        throw error;
    }
};

// Lista platillos. activo: true/false filtra; undefined devuelve todos.
export const listarPlatillos = async ({ tipo, activo } = {}) => {
    return prisma.platillos.findMany({
        where: {
            ...(activo !== undefined ? { activo } : {}),
            ...(tipo ? { tipo } : {}),
        },
        orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    });
};

// Devuelve un platillo con su receta (cuando existan filas en recetas).
export const obtenerPlatillo = async (id) => {
    const platillo = await prisma.platillos.findUnique({
        where: { id },
        include: { recetas: { include: { insumos: true } } },
    });
    if (!platillo) throw new Error('PLATILLO_NO_ENCONTRADO');
    return platillo;
};

export const crearPlatillo = async (datos) => {
    return prisma.platillos.create({ data: datos });
};

export const actualizarPlatillo = async (id, datos) => {
    try {
        return await prisma.platillos.update({ where: { id }, data: datos });
    } catch (error) {
        // P2025: el registro no existe
        if (error.code === 'P2025') throw new Error('PLATILLO_NO_ENCONTRADO');
        throw error;
    }
};

// Activa o desactiva un platillo. No se borra, para conservar el historial de ventas.
export const cambiarEstadoPlatillo = async (id, activo) => {
    try {
        return await prisma.platillos.update({ where: { id }, data: { activo } });
    } catch (error) {
        if (error.code === 'P2025') throw new Error('PLATILLO_NO_ENCONTRADO');
        throw error;
    }
};

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