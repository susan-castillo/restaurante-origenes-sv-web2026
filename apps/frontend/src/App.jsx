// =====================================================================
// App.jsx — mapa de rutas de TODA la aplicación.
// =====================================================================
import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

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
import SucursalesPage from './pages/SucursalesPage.jsx';
import SucursalDetallePage from './pages/SucursalDetallePage.jsx';
import PosPage from "./pages/PosPage.jsx";
import EmpleadosPage from "./pages/EmpleadosPage.jsx";
import PlanillaPage from "./pages/PlanillaPage.jsx";

import { getEstadoCaja } from "./services/cajasService.js";
import { getSucursales } from "./services/sucursales.js";

// Marco común de las pantallas internas: barra superior + menú lateral + contenido.
function DashboardLayout() {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const esSucursales = pathname === '/admin/sucursales' || pathname.startsWith('/admin/sucursales/');

    // Estados dinámicos traídos de la base de datos
    const [sucursales, setSucursales] = useState([]);
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
    const [cajaAbierta, setCajaAbierta] = useState(false);

    // 1. Cargar la lista de sucursales desde la API
    useEffect(() => {
        const cargarSucursales = async () => {
            try {
                const data = await getSucursales();
                setSucursales(data);

                // Asignar por defecto la sucursal asignada al usuario o la primera disponible
                const sucursalInicial = data.find((s) => s.id === usuario?.sucursal_id) || usuario?.sucursal || data[0] || null;
                setSucursalSeleccionada(sucursalInicial);
            } catch (err) {
                console.error("Error al obtener sucursales:", err);
            }
        };

        if (usuario) {
            cargarSucursales();
        }
    }, [usuario]);

    // 2. Verificar si la caja de la sucursal seleccionada está abierta
    useEffect(() => {
        let vigente = true;
        const targetId = sucursalSeleccionada?.id || usuario?.sucursal_id;

        if (!targetId) {
            setCajaAbierta(false);
            return;
        }

        const consultarCaja = async () => {
            try {
                const res = await getEstadoCaja(targetId);
                if (vigente) setCajaAbierta(res?.abierta ?? res?.estado === "ABIERTA");
            } catch {
                if (vigente) setCajaAbierta(false);
            }
        };

        consultarCaja();
        return () => { vigente = false; };
    }, [sucursalSeleccionada, usuario]);

    // 3. Handlers para sucursales
    const handleCambiarSucursal = (sucursal) => {
        setSucursalSeleccionada(sucursal);
    };

    const sincronizarSucursal = (sucursal) => {
        setSucursales((actuales) => {
            const actualizadas = me.filter((sede) => sede.id !== sucursal.id);
            if (!sucursal.activa) return actualizadas;
            return [...actualizadas, sucursal].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        });
        setSucursalSeleccionada((actual) => {
            if (actual?.id !== sucursal.id) return actual;
            return sucursal.activa ? sucursal : null;
        });
    };

    // Cierre de sesión centralizado
    const cerrarSesion = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="app-shell d-flex flex-column min-vh-100">
            <Navbar usuario={usuario}
                    {...(esSucursales ? { titulo: 'Sucursales', subtitulo: 'Consulta de sedes' } : {})}
                    sucursales={sucursales}
                    sucursalActual={sucursalSeleccionada}
                    cajaAbierta={cajaAbierta}
                    onCambiarSucursal={handleCambiarSucursal}
                    onLogout={cerrarSesion} />
            <div className="d-flex flex-grow-1">
                <Sidebar onLogout={cerrarSesion} />
                <main className="flex-grow-1 p-4 bg-light">
                    {/* Inyección del contexto para subpáginas que lo requieran */}
                    <Outlet context={{ sucursalSeleccionada, sucursales, handleCambiarSucursal, sincronizarSucursal }} />
                </main>
            </div>
        </div>
    );
}

// "/" redirige según el rol del usuario logged-in
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

            {/* ---------- Rutas protegidas por autenticación ---------- */}
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Inicio />} />

                <Route element={<DashboardLayout />}>
                    {/* Punto de venta: EMPLEADO y ADMIN */}
                    <Route element={<ProtectedRoute roles={['EMPLEADO', 'ADMIN']} />}>
                        <Route path="/pos" element={<PosPage titulo="Punto de venta" responsable="Frontend 1" />} />
                    </Route>

                    {/* Administración: solo ADMIN */}
                    <Route element={<ProtectedRoute roles={['ADMIN']} />}>
                        <Route path="/admin" element={<Navigate replace to="/admin/inventario" />} />
                        <Route path="/admin/inventario" element={<InventarioPage />} />
                        <Route path="/admin/sucursales" element={<SucursalesPage />} />
                        <Route path="/admin/sucursales/:id" element={<SucursalDetallePage />} />
                        <Route path="/admin/compras" element={<EnConstruccionPage titulo="Compras" responsable="Frontend 4" />} />
                        <Route path="/admin/caja" element={<EnConstruccionPage titulo="Historial de caja" responsable="Frontend 4" />} />
                    </Route>

                    {/* Recursos humanos: RRHH y ADMIN */}
                    <Route element={<ProtectedRoute roles={['RRHH', 'ADMIN']} />}>
                        <Route path="/admin/rrhh" element={<EnConstruccionPage titulo="Recursos Humanos" responsable="Frontend 3" />} />
                        <Route path="/rrhh/empleados" element={<EmpleadosPage />} />
                        <Route path="/rrhh/planilla" element={<PlanillaPage />} />
                    </Route>
                </Route>
            </Route>

            {/* ---------- Fallback 404 ---------- */}
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