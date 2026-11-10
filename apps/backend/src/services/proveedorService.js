import { prisma } from '../models/db.js';

export const listarProveedores = () => prisma.proveedores.findMany({
    orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
});

export const obtenerProveedor = (id) => prisma.proveedores.findUnique({
    where: { id },
});

export const crearProveedor = (datos) => prisma.proveedores.create({
    data: datos,
});

export const actualizarProveedor = (id, datos) => prisma.proveedores.update({
    where: { id },
    data: datos,
});

export const eliminarProveedor = (id) => prisma.proveedores.delete({
    where: { id },
});