import * as rrhhService from '../services/rrhhService.js';
import { idValido, aNumero } from '../utils/validaciones.js';

const ROLES = ['ADMIN', 'RRHH', 'EMPLEADO'];
const CARGOS = ['BARISTA', 'CAJERO', 'GERENTE'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorPassword = (password) => {
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
        return 'La contraseña debe tener entre 8 y 72 caracteres.';
    }
    return null;
};

//Validar un usuario.
const validarUsuario = (body, { parcial = false } = {}) => {
    const datos = {};

    // Al crear, estos tres campos son obligatorios
    if (!parcial && (body.nombre === undefined || body.email === undefined || body.password === undefined)) {
        return { error: 'Nombre, email y contraseña son requeridos.' };
    }

    if (body.nombre !== undefined) {
        const nombre = typeof body.nombre === 'string' ? body.nombre.trim() : '';
        if (!nombre || nombre.length > 100) {
            return { error: 'El nombre es requerido y no puede superar 100 caracteres.' };
        }
        datos.nombre = nombre;
    }

    if (body.email !== undefined) {
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (!EMAIL_REGEX.test(email) || email.length > 100) {
            return { error: 'El email debe ser un correo electrónico válido.' };
        }
        datos.email = email;
    }

    if (!parcial) {
        const error = errorPassword(body.password);
        if (error) {
            return { error };
        }
        datos.password = body.password;
    }

    if (body.rol !== undefined) {
        const rol = String(body.rol).trim().toUpperCase();
        if (!ROLES.includes(rol)) {
            return { error: 'El rol debe ser ADMIN, RRHH o EMPLEADO.' };
        }
        datos.rol = rol;
    }

    if (body.cargo !== undefined) {
        const cargo = String(body.cargo).trim().toUpperCase();
        if (!CARGOS.includes(cargo)) {
            return { error: 'El cargo debe ser BARISTA, CAJERO o GERENTE.' };
        }
        datos.cargo = cargo;
    }

    if (body.salario_base !== undefined) {
        const salario = aNumero(body.salario_base);
        if (!Number.isFinite(salario) || salario < 0 || salario > 999999.99) {
            return { error: 'El salario base debe ser un número entre 0 y 999999.99.' };
        }
        datos.salario_base = Math.round(salario * 100) / 100;
    }

    // null = usuario sin sucursal (por ejemplo, administración central)
    if (body.sucursal_id !== undefined) {
        if (body.sucursal_id === null) {
            datos.sucursal_id = null;
        } else {
            const sucursalId = aNumero(body.sucursal_id);
            if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
                return { error: 'La sucursal no es válida.' };
            }
            datos.sucursal_id = sucursalId;
        }
    }

    if (parcial && Object.keys(datos).length === 0) {
        return { error: 'Envía al menos un campo para actualizar.' };
    }

    return { datos };
};

//Validar id.
const validarId = (valor) => {
    const id = idValido(valor);
    if (!id) {
        return { error: 'El id del usuario no es válido.' };
    }
    return { id };
};

const manejarError = (error, res, mensajeGenerico) => {
    // Errores de negocio lanzados desde el service (traen su propio código HTTP)
    if (error.status) {
        return res.status(error.status).json({ error: error.message });
    }
    if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Ya existe un usuario con ese email.' });
    }
    if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    if (error.code === 'P2003') {
        return res.status(400).json({ error: 'La sucursal indicada no existe.' });
    }
    console.error(mensajeGenerico, error);
    return res.status(500).json({ error: mensajeGenerico });
};

//Manejo de errores de validación de usuarios.
export const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await rrhhService.listarUsuarios();
        return res.status(200).json(usuarios);
    } catch (error) {
        return manejarError(error, res, 'Error al listar los usuarios.');
    }
};

//Validacion al crear un nuevo usuario.
export const crearUsuario = async (req, res) => {
    try {
        const { datos, error } = validarUsuario(req.body);
        if (error) {
            return res.status(400).json({ error });
        }
        const usuario = await rrhhService.agregarUsuario(datos);
        return res.status(201).json({ mensaje: 'Usuario creado exitosamente.', usuario });
    } catch (error) {
        return manejarError(error, res, 'Error al crear el usuario.');
    }
};

//Validación al actualizar un usuario.
export const actualizarUsuario = async (req, res) => {
    try {
        const { id, error: errorId } = validarId(req.params.id);
        if (errorId) {
            return res.status(400).json({ error: errorId });
        }
        const { datos, error } = validarUsuario(req.body, { parcial: true });
        if (error) {
            return res.status(400).json({ error });
        }
        const usuario = await rrhhService.actualizarUsuario(id, datos);
        return res.status(200).json({ mensaje: 'Usuario actualizado exitosamente.', usuario });
    } catch (error) {
        return manejarError(error, res, 'Error al actualizar el usuario.');
    }
};

//Validación al desactivar un usuario.
export const desactivarUsuario = async (req, res) => {
    try {
        const { id, error: errorId } = validarId(req.params.id);
        if (errorId) {
            return res.status(400).json({ error: errorId });
        }
        // req.usuario.id = quién hace la acción (lo pone verifyToken)
        const usuario = await rrhhService.desactivarUsuario(id, req.usuario.id);
        return res.status(200).json({ mensaje: 'Usuario desactivado exitosamente.', usuario });
    } catch (error) {
        return manejarError(error, res, 'Error al desactivar el usuario.');
    }
};

//Cambiar contraseaña de un usuario validaciones.
export const cambiarPassword = async (req, res) => {
    try {
        const { id, error: errorId } = validarId(req.params.id);
        if (errorId) {
            return res.status(400).json({ error: errorId });
        }
        const error = errorPassword(req.body.password);
        if (error) {
            return res.status(400).json({ error });
        }
        await rrhhService.actualizarPassword(id, req.body.password);
        return res.status(200).json({ mensaje: 'Contraseña cambiada exitosamente.' });
    } catch (error) {
        return manejarError(error, res, 'Error al cambiar la contraseña del usuario.');
    }
};

//Buscar usuario por ID
export const buscarUsuarioPorId = async (req, res) => {
    try {
        const { id, error: errorId } = validarId(req.params.id);
        if (errorId) {
            return res.status(400).json({ error: errorId });
        }
        const usuario = await rrhhService.buscarUsuarioPorId(id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        return res.status(200).json(usuario);
    } catch (error) {
        return manejarError(error, res, 'Error al buscar el usuario.');
    }
};

//Buscar usuario por nombre.
export const buscarUsuarioPorNombre = async (req, res) => {
    try {
        const nombre = typeof req.query.nombre === 'string' ? req.query.nombre.trim() : '';
        if (!nombre || nombre.length > 100) {
            return res.status(400).json({ error: 'El nombre del usuario es requerido (máximo 100 caracteres).' });
        }
        const usuario = await rrhhService.buscarUsuarioPorNombre(nombre);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        return res.status(200).json(usuario);
    } catch (error) {
        return manejarError(error, res, 'Error al buscar el usuario por nombre.');
    }
};