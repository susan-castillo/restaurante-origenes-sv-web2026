// CRUD de Empleados (todo administrado por una sola sucursal).

import bcrypt from 'bcryptjs';
import { prisma } from '../models/db.js';
import { coincideNombre } from '../utils/validaciones.js';

//Configuración que determina el coste de la función de hash.
const saltRounds = 10;

const usuario = {
    id: true,
    nombre: true,
    email: true,
    rol: true,
    cargo: true,
    salario_base: true,
    sucursal_id: true,
    activo: true
};

//Error de negocio.
const errorNegocio = (mensaje, status) => Object.assign(new Error(mensaje), { status });

// Verifica que la sucursal exista y esté activa; si no, error 400.
const validarSucursalActiva = async (sucursalId) => {
    const sucursal = await prisma.sucursales.findUnique({
        where: { id: Number(sucursalId) },
        select: { activa: true }
    });
    if (!sucursal) throw errorNegocio('La sucursal indicada no existe.', 400);
    if (sucursal.activa !== true) throw errorNegocio('La sucursal seleccionada se encuentra inactiva', 400);
};

// Crear un nuevo usuario en la sucursal indicada (debe estar activa)
export const agregarUsuario = async (datosUsuario, sucursalId) => {
    await validarSucursalActiva(sucursalId);
    const passwordHash = await bcrypt.hash(datosUsuario.password, saltRounds);

    return prisma.usuarios.create({
        data: {
            nombre: datosUsuario.nombre,
            email: datosUsuario.email,
            password_hash: passwordHash,
            rol: datosUsuario.rol,
            cargo: datosUsuario.cargo,
            salario_base: datosUsuario.salario_base,
            sucursal_id: sucursalId
        },
        select: usuario
    });
};

// Obtener los usuarios de una sucursal (buscar: texto dentro del nombre).
export const listarUsuarios = async (sucursalId, { buscar } = {}) => {
    const usuarios = await prisma.usuarios.findMany({
        where: { sucursal_id: sucursalId },
        orderBy: { nombre: 'asc' },
        select: usuario
    });
    return usuarios.filter((u) => !buscar || coincideNombre(u.nombre, buscar));
};

// Obtener un usuario por su ID (solo si es de la sucursal)
export const buscarUsuarioPorId = async (id, sucursalId) => {
    return prisma.usuarios.findFirst({
        where: { id: Number(id), sucursal_id: sucursalId },
        select: usuario
    });
};

// Obtener un usuario por nombre o email dentro de la sucursal
export const buscarUsuarioPorNombre = async (nombre, sucursalId) => {
    return prisma.usuarios.findFirst({
        where: {
            sucursal_id: sucursalId,
            OR: [{ nombre: nombre }, { email: nombre }]
        },
        select: usuario
    });
};

// Actualizar un usuario de la sucursal.
export const actualizarUsuario = async (id, datosUsuario, sucursalId) => {
    // Si lo mueve a otra sucursal, la nueva debe estar activa
    if (datosUsuario.sucursal_id !== undefined && datosUsuario.sucursal_id !== sucursalId) {
        await validarSucursalActiva(datosUsuario.sucursal_id);
    }

    // Si no es de esa sucursal, update lanza P2025 (404)
    return prisma.usuarios.update({
        where: { id: Number(id), sucursal_id: sucursalId },
        data: {
            nombre: datosUsuario.nombre,
            email: datosUsuario.email,
            rol: datosUsuario.rol,
            cargo: datosUsuario.cargo,
            salario_base: datosUsuario.salario_base,
            sucursal_id: datosUsuario.sucursal_id
        },
        select: usuario
    });
};

// Cambiar la contraseña de un usuario de la sucursal
export const actualizarPassword = async (id, password, sucursalId) => {
    const passwordHash = await bcrypt.hash(password, saltRounds);

    return prisma.usuarios.update({
        where: { id: Number(id), sucursal_id: sucursalId },
        data: { password_hash: passwordHash },
        select: usuario
    });
};

// Desactivar un usuario de la sucursal.
export const desactivarUsuario = async (id, actorId, sucursalId) => {
    const idUsuario = Number(id);

    // Evita desactivarse el mismo usuario a sí mismo
    if (idUsuario === actorId) {
        throw errorNegocio('No puedes desactivar tu propio usuario.', 409);
    }

    // Debe pertenecer a la sucursal
    const objetivo = await prisma.usuarios.findFirst({
        where: { id: idUsuario, sucursal_id: sucursalId },
        select: { rol: true }
    });
    if (!objetivo) throw errorNegocio('Usuario no encontrado.', 404);

    // Debe de existir siempre un administrador
    if (objetivo.rol === 'ADMIN') {
        const admins = await prisma.usuarios.count({ where: { rol: 'ADMIN', activo: true } });
        if (admins <= 1) {
            throw errorNegocio('No puedes desactivar al único administrador.', 409);
        }
    }

    return prisma.usuarios.update({
        where: { id: idUsuario, sucursal_id: sucursalId },
        data: { activo: false },
        select: usuario
    });
};