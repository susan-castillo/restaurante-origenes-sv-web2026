// =====================================================================
// Sidebar.jsx — menú lateral. Solo muestra lo que el rol del usuario puede usar.
// =====================================================================
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { menuPermitido } from '../config/navegacion.js';
import logoOrigenes from '../assets/panacota-sinbg.png';

export default function Sidebar({ onLogout }) {
    const { usuario } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Si por alguna razón no hay usuario, no se dibuja nada (ProtectedRoute ya lo habría sacado).
    if (!usuario) return null;

    const items = menuPermitido(usuario);

    return (
        <aside className={`sidebar-origenes ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Botón para colapsar o expandir el menú */}
            <button
                className="btn-toggle-sidebar"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
                {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>

            {/* Cabecera: logo y nombre */}
            <div className="sidebar-header">
                {!isCollapsed && (
                    <div className="sidebar-brand-text">
                        <h1 className="font-origenes brand-title">Orígenes SV</h1>
                        <span className="brand-subtitle">Pateleria y cafetería</span>
                    </div>
                )}
            </div>

            <hr className="sidebar-divider" />

            {/* Navegación: solo las opciones permitidas para este rol */}
            <nav className="sidebar-nav">
                <ul className="list-unstyled mb-0">
                    {items.map((item) => {
                        // Un componente en variable con mayúscula para poder dibujarlo: <Icono />
                        const Icono = item.icono;
                        return (
                            <li key={item.ruta} className="nav-item-container">
                                <NavLink
                                    to={item.ruta}
                                    className={({ isActive }) => `sidebar-link font-poppins ${isActive ? 'active' : ''}`}
                                >
                                    <span className="link-icon"><Icono /></span>
                                    {!isCollapsed && <span className="link-text">{item.etiqueta}</span>}
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Pie: cerrar sesión */}
            <div className="sidebar-footer">
                <button className="logout-button" onClick={onLogout}>
                    <span className="link-icon"><FaSignOutAlt /></span>
                    {!isCollapsed && <span className="link-text">Cerrar sesión</span>}
                </button>
            </div>
        </aside>
    );
}
