// CRUD de Empleados.

import bcrypt from 'bcryptjs';
import { prisma } from '../models/db.js';

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

// Crear un nuevo usuario en la base de datos
export const agregarUsuario = async (datosUsuario) => {
    const passwordHash = await bcrypt.hash(datosUsuario.password, saltRounds);

    return prisma.usuarios.create({
        data: {
            nombre: datosUsuario.nombre,
            email: datosUsuario.email,
            password_hash: passwordHash,
            rol: datosUsuario.rol,
            cargo: datosUsuario.cargo,
            salario_base: datosUsuario.salario_base,
            sucursal_id: datosUsuario.sucursal_id
        },
        select: usuario
    });
};

// Obtener todos los usuarios de la base de datos.
export const listarUsuarios = async () => {
    return prisma.usuarios.findMany({
        select: usuario
    });
};

// Obtener un usuarios por su ID
export const buscarUsuarioPorId = async (id) => {
    return prisma.usuarios.findUnique({
        where: { id: Number(id) },
        select: usuario
    });
};

//Obtener un usuario por su nombre o email
export const buscarUsuarioPorNombre = async (nombre) => {
    return prisma.usuarios.findFirst({
        where: {
            OR: [
                { nombre: nombre },
                { email: nombre }
            ]
        },
        select: usuario
    });
};

// Actualizar un usuario existente en la base de datos.
export const actualizarUsuario = async (id, datosUsuario) => {
    return prisma.usuarios.update({
        where: { id: Number(id) },
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

// Cambiar la contraseña de un usuario existente
export const actualizarPassword = async (id, password) => {
    const passwordHash = await bcrypt.hash(password, saltRounds);

    return prisma.usuarios.update({
        where: { id: Number(id) },
        data: { password_hash: passwordHash },
        select: usuario
    });
};

// Desactivar un usuario de la base de datos.
export const desactivarUsuario = async (id, actorId) => {
    const idUsuario = Number(id);

    // Evita desactivarse el mismo usuario a sí mismo
    if (idUsuario === actorId) {
        throw errorNegocio('No puedes desactivar tu propio usuario.', 409);
    }

    // Debe de existir siempre un administrador
    const objetivo = await prisma.usuarios.findUnique({
        where: { id: idUsuario },
        select: { rol: true }
    });
    if (objetivo?.rol === 'ADMIN') {
        const admins = await prisma.usuarios.count({ where: { rol: 'ADMIN', activo: true } });
        if (admins <= 1) {
            throw errorNegocio('No puedes desactivar al único administrador.', 409);
        }
    }

    return prisma.usuarios.update({
        where: { id: idUsuario },
        data: { activo: false },
        select: usuario
    });
};