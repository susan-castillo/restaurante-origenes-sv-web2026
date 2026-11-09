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
import {useEffect, useState} from "react";
import {getEstadoCaja} from "./services/cajasService.js";
import {getSucursales} from "./services/sucursales.js";
import EmpleadosPage from "./pages/EmpleadosPage.jsx";
import PlanillaPage from "./pages/PlanillaPage.jsx";

// Marco común de las pantallas internas: barra superior + menú lateral + contenido.
function DashboardLayout() {
    const { usuario, logout } = useAuth();
    const navigate = useNavigate();

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

                // Asignar por defecto la sucursal asignada al usuario
                const sucursalInicial = usuario?.sucursal || data[0];
                setSucursalSeleccionada(sucursalInicial);
            } catch (err) {
                console.error("Error al obtener sucursales:", err);
            }
        };

        if (usuario) {
            cargarSucursales().then(r => {}).catch(err => console.error(err));
        }
    }, [usuario]);

    // 2. Verificar si la caja de la sucursal seleccionada está abierta
    useEffect(() => {
        const consultarCaja = async () => {
            if (!sucursalSeleccionada?.id && !usuario?.sucursal_id) return;

            const targetId = sucursalSeleccionada?.id || usuario?.sucursal_id;
            try {
                const res = await getEstadoCaja(targetId);
                // backend suele responder: { abierta: true/false } o { estado: "ABIERTA" }
                setCajaAbierta(res?.abierta ?? res?.estado === "ABIERTA");
            } catch {
                setCajaAbierta(false);
            }
        };

        consultarCaja().then(r => {}).catch(err => console.error(err));
    }, [sucursalSeleccionada, usuario]);

    // 3. Cambiar sucursal
    const handleCambiarSucursal = (sucursal) => {
        setSucursalSeleccionada(sucursal);
    };

    // Una sola forma de cerrar sesión, usada por el Navbar y por el Sidebar.
    // Primero se borra la sesión y luego se navega al login (replace: el botón "atrás" no vuelve).
    const cerrarSesion = () => {
        logout();
        navigate('/login', { replace: true });
    };

    return (
        <div className="app-shell d-flex flex-column min-vh-100">
            <Navbar usuario={usuario}
                    sucursales={sucursales}
                    sucursalActual={sucursalSeleccionada}
                    cajaAbierta={cajaAbierta}
                    onCambiarSucursal={handleCambiarSucursal}
                    onLogout={cerrarSesion} />
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
                        <Route path="/rrhh/empleados" element={<EmpleadosPage />} />
                        <Route path="/rrhh/planilla" element={<PlanillaPage />} />
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
