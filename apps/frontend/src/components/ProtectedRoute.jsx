import {Navigate, Outlet, useLocation, useOutletContext} from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { esAdminCentral } from '../config/navegacion.js';

// roles: lista de roles que pueden entrar.
// soloCentral: además del rol, exige ser administrador central (ADMIN sin sucursal).
export default function ProtectedRoute({ roles, soloCentral = false }) {
  const { usuario, cargando } = useAuth();
  const ubicacion = useLocation();

  //Nos sirve para poder pasar la sucursal seleccionada del navBar a las demas pantallas
  const context =  useOutletContext();

  // 1) Todavía verificando el token guardado: ni dejamos pasar ni expulsamos.
  if (cargando) {
    return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
          <p className="text-secondary font-poppins">Cargando sesión...</p>
        </div>
    );
  }

  // 2) Sin sesión -> al login. Guardamos desde dónde venía para volver ahí después de entrar.
  if (!usuario) {
    return <Navigate replace to="/login" state={{ desde: ubicacion }} />;
  }

  // 3) Con sesión pero sin el rol necesario -> pantalla de "sin permiso".
  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate replace to="/no-autorizado" />;
  }

  // 4) Rutas exclusivas de Administración central (ej. dashboard global).
  if (soloCentral && !esAdminCentral(usuario)) {
    return <Navigate replace to="/no-autorizado" />;
  }

  // 5) se muestran las rutas hijas.
  return <Outlet context={context} />;
}