// =====================================================================
// api.js — ÚNICO lugar que habla con el backend.
// Regla del equipo: ninguna pantalla usa fetch() directo, todas llaman a apiFetch().
// Así el token, la URL y el manejo de errores se arreglan en UN solo archivo.
// =====================================================================

// --- Manejo del token --------------------------------------------------
// Antes "token" estaba escrito a mano en AuthContext, Sidebar y ProtectedRoute.
// Ahora todos usan estas tres funciones: si cambia la clave, se cambia aquí.
const TOKEN_KEY = 'token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// --- URL base ----------------------------------------------------------
// Vacío = rutas relativas ("/api/..."). En desarrollo, Vite las reenvía al backend
// con el proxy de vite.config.js, así el navegador cree que todo es el mismo sitio
// y NO hace falta configurar CORS.
// VITE_API_URL solo se usa si algún día el frontend se publica separado del backend.
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
 *   const { usuario } = await apiFetch('/api/auth/me');
 *   await apiFetch('/api/pos/ventas', { method: 'POST', body: JSON.stringify(datos) });
 * Devuelve el JSON de la respuesta o lanza ApiError con un mensaje legible.
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    // Content-Type solo cuando mandamos cuerpo (en un GET sobra)
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    // El token viaja en CADA petición; el backend saca de él el usuario, el rol y la sucursal
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  } catch {
    // fetch solo "lanza" cuando no hay conexión: backend apagado, sin internet, etc.
    throw new ApiError('No se pudo conectar con el servidor. Revisa que el backend esté encendido.', 0);
  }

  // Si la respuesta no es JSON (por ejemplo una página de error de un proxy), no truena:
  // data queda en null y más abajo se arma un mensaje genérico.
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // 401 con token guardado = la sesión venció o el token ya no sirve.
    // Limpiamos y avisamos a AuthContext (que escucha este evento) para sacar al usuario.
    if (response.status === 401 && token) {
      clearToken();
      window.dispatchEvent(new Event('auth:expirada'));
    }
    throw new ApiError(data?.error || `Error ${response.status} en la petición`, response.status);
  }

  return data;
};
