// Lógica de negocio del catálogo de insumos (comunicación con Prisma).
import { prisma } from '../models/db.js';
import { coincideNombre } from '../utils/validaciones.js';

// Lista el catálogo ordenado por nombre.
// activo: true/false filtra por estado (undefined = todos).
// buscar: texto dentro del nombre.
// sucursalId: solo los insumos registrados en el inventario de esa sucursal.
export const listarInsumos = async ({ activo, buscar, sucursalId } = {}) => {
    if (sucursalId) {
        const sucursal = await prisma.sucursales.findUnique({ where: { id: sucursalId } });
        if (!sucursal) throw new Error('SUCURSAL_NO_ENCONTRADA');
    }

    const insumos = await prisma.insumos.findMany({
        where: {
            ...(activo !== undefined ? { activo } : {}),
            ...(sucursalId ? { inventario_sucursal: { some: { sucursal_id: sucursalId } } } : {}),
        },
        orderBy: { nombre: 'asc' },
    });
    return buscar ? insumos.filter((insumo) => coincideNombre(insumo.nombre, buscar)) : insumos;
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

// Activa o desactiva un insumo. No se borra: solo deja de mostrarse en el sistema.
export const cambiarEstadoInsumo = async (id, activo) => {
    try {
        return await prisma.insumos.update({ where: { id }, data: { activo } });
    } catch (error) {
        if (error.code === 'P2025') throw new Error('INSUMO_NO_ENCONTRADO');
        throw error;
    }
};