// =====================================================================
// App.jsx — mapa de rutas de TODA la aplicación.
// =====================================================================
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { rutaInicial } from './config/navegacion.js';
import Login from './pages/Login.jsx';
import NotFound from './pages/NotFound.jsx';
import NoAutorizadoPage from "./pages/NoAutorizados.jsx";
import EnConstruccionPage from "./pages/EnConstruccion.jsx";
import InventarioPage from './pages/InventarioPage.jsx';

// Marco común de las pantallas internas: barra superior + menú lateral + contenido.
function DashboardLayout() {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();

    // Una sola forma de cerrar sesión, usada por el Navbar y por el Sidebar.
    // Primero se borra la sesión y luego se navega al login (replace: el botón "atrás" no vuelve).
    const cerrarSesion = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="app-shell d-flex flex-column min-vh-100">
            <Navbar usuario={usuario} onLogout={cerrarSesion} />
            <div className="d-flex flex-grow-1">
                <Sidebar onLogout={cerrarSesion} />
                <main className="flex-grow-1 p-4 bg-light">
                    {/* Aquí se dibuja la página que corresponde a la ruta */}
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

// "/" no es una pantalla: manda a cada usuario a la principal de su rol.
function Inicio() {
    const { usuario } = useAuth();
    return <Navigate replace to={rutaInicial(usuario)} />;
}

function AppRoutes() {
    return (
        <Routes>
            {/* ---------- Rutas públicas ---------- */}
            <Route path="/login" element={<Login />} />
            <Route path="/no-autorizado" element={<NoAutorizadoPage />} />

            {/* ---------- Rutas que exigen sesión ---------- */}
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Inicio />} />

                <Route element={<DashboardLayout />}>
                    {/* Punto de venta: cajeros, baristas y gerentes de sucursal */}
                    <Route element={<ProtectedRoute roles={['EMPLEADO', 'ADMIN']} />}>
                        <Route path="/pos" element={<EnConstruccionPage titulo="Punto de venta" responsable="Frontend 1" />} />
                    </Route>

                    {/* Administración: solo ADMIN */}
                    <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                        <Route path="/admin" element={<Navigate replace to="/admin/inventario" />} />
                        <Route path="/admin/inventario" element={<InventarioPage />} />
                        <Route path="/admin/compras" element={<EnConstruccionPage titulo="Compras" responsable="Frontend 4" />} />
                        <Route path="/admin/caja" element={<EnConstruccionPage titulo="Historial de caja" responsable="Frontend 4" />} />
                    </Route>

                    {/* Recursos humanos: RRHH y ADMIN */}
                    <Route element={<ProtectedRoute roles={['RRHH', 'ADMIN']} />}>
                        <Route path="/admin/rrhh" element={<EnConstruccionPage titulo="Recursos Humanos" responsable="Frontend 3" />} />
                    </Route>
                </Route>
            </Route>

            {/* ---------- 404 ---------- */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}
