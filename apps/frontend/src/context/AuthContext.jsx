import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // 1. Verificar sesión persistente al recargar la página (GET /api/auth/me)
  useEffect(() => {
    const verificarSesion = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const user = await apiFetch('/api/auth/me');
          setUsuario(user);
        } catch {
          // Si el token expiró o es inválido, limpiar el almacenamiento local
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          setUsuario(null);
        }
      }
      setCargando(false);
    };

    verificarSesion();
  }, []);

  // 2. Iniciar sesión y retornar la respuesta completa o el objeto de usuario
  const login = async (email, password) => {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Validar que la respuesta contenga el token y la información del usuario
    if (res?.token && res?.usuario) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('usuario', JSON.stringify(res.usuario));
      setUsuario(res.usuario);
      return res; // Retornamos la respuesta completa { token, usuario }
    }

    throw new Error('Respuesta del servidor no válida.');
  };

  // 3. Cerrar sesión y limpiar estados
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  return (
      <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);