// =====================================================================
// AuthContext.jsx — quién tiene la sesión iniciada, para toda la aplicación.
// =====================================================================
import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService.js';
import { clearToken, getToken, setToken } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);

  // Solo "cargando" si hay un token que verificar. Sin token no hay nada que esperar.
  const [cargando, setCargando] = useState(() => Boolean(getToken()));

  // 1) Al abrir o recargar la página: si hay token guardado, pedimos al backend quién es.
  useEffect(() => {
    if (!getToken()) return;

    authService
        .me()
        // El backend responde { usuario }: se desestructura.
        .then(({ usuario }) => setUsuario(usuario))
        .catch(() => clearToken()) // token vencido o falso: se descarta
        .finally(() => setCargando(false));
  }, []);

  // 2) Si cualquier petición recibe un 401, api.js lanza este evento: sacamos al usuario
  //    y ProtectedRoute lo manda al login automáticamente.
  useEffect(() => {
    const alExpirar = () => setUsuario(null);
    window.addEventListener('auth:expirada', alExpirar);
    return () => window.removeEventListener('auth:expirada', alExpirar);
  }, []);

  // 3) Iniciar sesión. Devuelve el USUARIO (un solo contrato claro para quien la llame).
  const login = async (email, password) => {
    const { token, usuario } = await authService.login(email, password);

    if (!token || !usuario) {
      throw new Error('Respuesta del servidor no válida.');
    }

    setToken(token); // solo se guarda el token; el usuario siempre se pide al backend
    setUsuario(usuario);
    return usuario;
  };

  // 4) Cerrar sesión: borra el token Y el estado en memoria (antes el Sidebar solo
  //    borraba el token y la app seguía creyendo que había sesión).
  const logout = () => {
    clearToken();
    setUsuario(null);
  };

  return (
      <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
        {children}
      </AuthContext.Provider>
  );
};

// Atajo para usar el contexto. Avisa claro si se olvidaron de envolver con <AuthProvider>
// (sin este aviso el error sería "Cannot destructure property of undefined").
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};
