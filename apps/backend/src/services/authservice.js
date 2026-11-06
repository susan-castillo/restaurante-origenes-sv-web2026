//El servicio(Logica de negocio) se encarga de hablar con Prisma(Base de datos), validar credenciales
// con bcrypt y firmar el JWT.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../models/db.js';

//Autentica las credenciales del usuario y genera un token JWT.
export const login = async (email, password) => {
    // Buscar al usuario por correo e incluir la información de su sucursal asignada
    const user = await prisma.usuarios.findUnique({
        where: { email },
        include: { sucursales: true }
    });

    if (!user || !user.activo) {
        throw new Error('CREDENCIALES_INVALIDAS');
    }

    // Comparar la contraseña ingresada en texto plano con el hash guardado en PostgreSQL
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
        throw new Error('CREDENCIALES_INVALIDAS');
    }

    // Estructura de datos almacenada dentro del token JWT
    const tokenData = {
        id: user.id,
        nombre: user.nombre,
        rol: user.rol,
        cargo: user.cargo,
        sucursal_id: user.sucursal_id
    };

    const token = jwt.sign(
        tokenData,
        process.env.JWT_SECRET || 'clave_secreta_origenes_2026',
        { expiresIn: '8h' }
    );

    return {
        token,
        usuario: {
            ...tokenData,
            sucursal: user.sucursales ? user.sucursales.nombre : 'Admin Central'
        }
    };
};


//Obtiene los datos del usuario autenticado para mantener la sesión activa.
export const getCurrentUser = async (userId) => {
    const user = await prisma.usuarios.findUnique({
        where: { id: userId },
        select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
            cargo: true,
            sucursal_id: true,
            sucursales: true
        }
    });

    if (!user) {
        throw new Error('USUARIO_NO_ENCONTRADO');
    }

    return user;
};