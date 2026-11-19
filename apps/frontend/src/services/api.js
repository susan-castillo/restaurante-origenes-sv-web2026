// =====================================================================
// api.js — Único lugar que habla con el backend.
// Regla del equipo: ninguna pantalla usa fetch() directo, todas llaman a apiFetch().
// Así el token, la URL y el manejo de errores se arreglan en UN solo archivo.
// =====================================================================

// --- Manejo del token --------------------------------------------------
const TOKEN_KEY = 'token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// --- URL base ----------------------------------------------------------
const API_URL = import.meta.env.VITE_API_URL ?? '';

// Error con código HTTP: permite distinguir un 401 (sesión) de un 400 (datos malos).
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Hace una petición al backend.
 * Si el proxy devuelve 502 porque el backend se está reiniciando, reintenta 1 vez.
 */
export const apiFetch = async (endpoint, options = {}, reintentos = 1) => {
  const token = getToken();

  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa que el backend esté encendido.', 0);
  }

  // Reintento automático si el proxy responde 502 durante el arranque/reinicio del backend
  if (response.status === 502 && reintentos > 0) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return apiFetch(endpoint, options, reintentos - 1);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearToken();
      window.dispatchEvent(new Event('auth:expirada'));
    }
    throw new ApiError(data?.error || `Error ${response.status} en la petición`, response.status);
  }

  return data;
};