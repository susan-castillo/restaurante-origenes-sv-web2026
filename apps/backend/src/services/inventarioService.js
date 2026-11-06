// Lógica de negocio del módulo de inventario y recetas (comunicación con Prisma).
import { prisma } from '../models/db.js';

// Devuelve el catálogo de insumos ordenado por nombre.
export const listarInsumos = async () => {
    return prisma.insumos.findMany({ orderBy: { nombre: 'asc' } });
};