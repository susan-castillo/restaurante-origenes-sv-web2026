// =====================================================================
// AuthContext.jsx — quién tiene la sesión iniciada, para toda la aplicación.
// =====================================================================
import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService.js';
import { clearToken, getToken, setToken } from '../services/api.js';

const USER_KEY = 'usuario';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // 1) Leemos el usuario guardado en localStorage al instante (evita parpadeos y expulsiones)
  const [usuario, setUsuario] = useState(() => {
    try {
      const guardado = localStorage.getItem(USER_KEY);
      return guardado ? JSON.parse(guardado) : null;
    } catch {
      return null;
    }
  });

  // Solo esperamos si hay token pero todavía no tenemos los datos cacheados del usuario
  const [cargando, setCargando] = useState(() => Boolean(getToken()) && !localStorage.getItem(USER_KEY));

  // 2) Al abrir o recargar la página: validamos el token en segundo plano con /me
  useEffect(() => {
    if (!getToken()) {
      localStorage.removeItem(USER_KEY);
      setUsuario(null);
      setCargando(false);
      return;
    }

    authService
        .me()
        .then((res) => {
          // Acepta tanto { usuario } como el objeto de usuario directo
          const userActual = res?.usuario || res;
          if (userActual) {
            localStorage.setItem(USER_KEY, JSON.stringify(userActual));
            setUsuario(userActual);
          }
        })
        .catch((err) => {
          // Solo cerramos sesión si el backend respondió explícitamente 401 (token vencido/inválido).
          // Si status es 0 o 502/504 (backend reiniciando por --watch), conservamos la sesión local.
          if (err?.status === 401) {
            clearToken();
            localStorage.removeItem(USER_KEY);
            setUsuario(null);
          }
        })
        .finally(() => setCargando(false));
  }, []);

  // 3) Si cualquier petición posterior recibe un 401, api.js lanza este evento:
  //    limpiamos memoria y ProtectedRoute manda al login automáticamente.
  useEffect(() => {
    const alExpirar = () => {
      localStorage.removeItem(USER_KEY);
      setUsuario(null);
    };
    window.addEventListener('auth:expirada', alExpirar);
    return () => window.removeEventListener('auth:expirada', alExpirar);
  }, []);

  // 4) Iniciar sesión. Devuelve el USUARIO (un solo contrato claro para quien la llame).
  const login = async (email, password) => {
    const res = await authService.login(email, password);
    const userObj = res?.usuario || res?.user;

    if (!res?.token || !userObj) {
      throw new Error('Respuesta del servidor no válida.');
    }

    setToken(res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(userObj));
    setUsuario(userObj);
    return userObj;
  };

  // 5) Cerrar sesión: borra token, caché local y estado en memoria.
  const logout = () => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setUsuario(null);
  };

  return (
      <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
        {children}
      </AuthContext.Provider>
  );
};

// Atajo para usar el contexto. Avisa claro si se olvidaron de envolver con <AuthProvider>
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};