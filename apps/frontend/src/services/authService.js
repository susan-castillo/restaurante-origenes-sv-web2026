// =====================================================================
// authService.js — las llamadas HTTP de la autenticación.
// =====================================================================
import { apiFetch } from './api.js';

export const authService = {
    // Respuesta del backend: { token, usuario }
    login: (email, password) =>
        apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    // OJO: el backend responde { usuario }, NO el usuario suelto.
    me: () => apiFetch('/auth/me'),
};
