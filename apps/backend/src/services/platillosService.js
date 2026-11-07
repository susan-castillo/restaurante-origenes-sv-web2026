// Lógica de negocio del menú de platillos (comunicación con Prisma).
import { prisma } from '../models/db.js';
import { coincideNombre } from '../utils/validaciones.js';

// Lista platillos. activo: true/false filtra por estado (undefined = todos).
// buscar: texto dentro del nombre.
export const listarPlatillos = async ({ tipo, activo, buscar } = {}) => {
    const platillos = await prisma.platillos.findMany({
        where: {
            ...(activo !== undefined ? { activo } : {}),
            ...(tipo ? { tipo } : {}),
        },
        orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }],
    });
    return buscar ? platillos.filter((platillo) => coincideNombre(platillo.nombre, buscar)) : platillos;
};

// Devuelve un platillo con su receta.
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