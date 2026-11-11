// Su única tarea es validar las entradas HTTP de Express,
// llamar al servicio y responder con los códigos de estado adecuados (200, 400, 401, 500).

import * as authService from '../services/authService.js';

// Controlador para procesar la petición de inicio de sesión
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
        }

        const result = await authService.login(email, password);
        return res.status(200).json(result);

    } catch (error) {
        if (error.message === 'CREDENCIALES_INVALIDAS') {
            return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo.' });
        }
        console.error('Error en login:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

// Controlador para obtener la información de la sesión activa (/api/auth/me)
export const getCurrentUser = async (req, res) => {
    try {
        const user = await authService.getCurrentUser(req.usuario.id);
        return res.status(200).json(user);
    } catch (error) {
        if (error.message === 'USUARIO_NO_ENCONTRADO') {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        return res.status(500).json({ error: 'Error al obtener datos de la sesión.' });
    }
};