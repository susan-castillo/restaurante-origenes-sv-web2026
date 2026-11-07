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

// Lista platillos. Por defecto solo los activos (menú del POS).
export const listarPlatillos = async ({ tipo, incluirInactivos = false } = {}) => {
    return prisma.platillos.findMany({
        where: {
            ...(incluirInactivos ? {} : { activo: true }),
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

// No se borra: se desactiva para conservar el historial de ventas.
export const desactivarPlatillo = async (id) => {
    try {
        return await prisma.platillos.update({ where: { id }, data: { activo: false } });
    } catch (error) {
        if (error.code === 'P2025') throw new Error('PLATILLO_NO_ENCONTRADO');
        throw error;
    }
};