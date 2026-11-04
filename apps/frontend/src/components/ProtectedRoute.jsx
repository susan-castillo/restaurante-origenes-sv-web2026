import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ roles }) {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="p-4 text-secondary">Comprobando sesion...</p>;
  }

  if (!token || !user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}
