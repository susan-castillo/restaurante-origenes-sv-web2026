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