import { prisma } from '../models/db.js';

export const getSucursales = async (usuario) => {
    // 1. Si es ADMIN o su sucursal_id es null, devuelve TODAS las sucursales activas
    if (usuario.rol === 'ADMIN' || !usuario.sucursal_id) {
        return prisma.sucursales.findMany({
            where: {activa: true},
            select: {id: true, nombre: true, direccion: true},
            orderBy: {nombre: 'asc'}
        });
    }

    // 2. Si es EMPLEADO o RRHH asignado a un local específico, devuelve SOLO su sucursal
    return prisma.sucursales.findMany({
        where: {
            id: usuario.sucursal_id,
            activa: true
        },
        select: {id: true, nombre: true, direccion: true}
    });
};