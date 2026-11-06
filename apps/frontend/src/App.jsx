import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/Login.jsx";
import NotFound from "./pages/NotFound.jsx";

const moduleRoles = {
  pos: ["ADMIN", "EMPLEADO"],
  planilla: ["ADMIN", "RRHH"],
  inventario: ["ADMIN"],
};

function ModuleRoute() {
  const { module } = useParams();
  const { user } = useAuth();
  const roles = moduleRoles[module];
  if (!roles) return <NotFound />;
  if (!roles.includes(user.role)) return <Navigate replace to="/" />;
  return <ModulePage />;
}

function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <Navbar onLogout={logout} user={user} />
      <div className="d-flex flex-column flex-md-row">
        <Sidebar role={user.role} />
        <main className="flex-grow-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Login />} path="/" />
      <Route element={<NotFound />} path="*" />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
