// CRUD de Empleados. 

const { prisma } = require('../models/db');
import bcrypt from 'bcryptjs';

//Configuración que determina el coste de la función de hash.
const saltRounds = 10;

//
const usuario = {
    id: true,
    nombre: true,
    email: true,
    rol: true,
    cargo: true,
    salario_base: true,
    sucursal_id: true,
    activo: true
}

// Crear un nuevo usuario en la base de datos
export const agregarUsuario = async (datosUsuario) => {
    const passwordHash = await bcrypt.hash(datosUsuario.password, saltRounds);

    return await prisma.usuarios.create({

        data: {
            nombre: datosUsuario.nombre,
            email: datosUsuario.email,
            password_hash: datosUsuario.passwordHash,
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
    return await prisma.usuarios.findMany({
        select: usuario
    });
};

// Obtener un usuarios por su ID
export const buscarUsuarioPorId = async (id) => {
    return await prisma.usuarios.findUnique({
        where: { id },
        select: usuario
    });
};

//Obtener un usuario por su nombre o email
export const buscarUsuarioPorNombre = async (nombre) => {
    return await prisma.usuarios.findFirst({
        where: {
            OR: [
                { nombre: nombre },
                { email: nombre }
            ]
        },
        select: usuario
    })
}

// Actualizar un usuario existente en la base de datos. 
export const actualizarUsuario = async (id, datosUsuario) => {

    return await prisma.usuarios.update({
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

    return await prisma.usuarios.update({
        where: { id },
        data: {
            password_hash: passwordHash
        },
        select: usuario
    })
};

// Desactivar un usuario de la base de datos. 

export const desactivarUsuario = async (id) => {
    return await prisma.usuarios.update({
        where: { id: Number(id) },
        data: {
            activo: false
        },
        select: usuario
    });
};




