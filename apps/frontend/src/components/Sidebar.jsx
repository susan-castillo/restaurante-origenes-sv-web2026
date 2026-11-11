// =====================================================================
// Sidebar.jsx — menú lateral con soporte para submenús colapsables.
// =====================================================================
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaChevronDown, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { menuPermitido } from '../config/navegacion.js';

// Componente auxiliar para renderizar cada elemento del menú (con o sin sub-opciones)
function SidebarNavItem({ item, isSidebarCollapsed }) {
    const [subOpen, setSubOpen] = useState(false);
    const Icono = item.icono;

    // Caso A: Si NO tiene sub-opciones, renderizamos un NavLink estándar
    if (!item.hijos || item.hijos.length === 0) {
        return (
            <li className="nav-item-container">
                <NavLink
                    to={item.ruta}
                    className={({ isActive }) => `sidebar-link font-poppins ${isActive ? 'active' : ''}`}
                >
                    <span className="link-icon"><Icono /></span>
                    {!isSidebarCollapsed && <span className="link-text">{item.etiqueta}</span>}
                </NavLink>
            </li>
        );
    }

    // Caso B: Si TIENE sub-opciones (como Recursos Humanos), renderizamos el acordeón desplegable
    return (
        <li className={`nav-item-container has-submenu ${subOpen ? 'open' : ''}`}>
            <button
                type="button"
                className="sidebar-link font-poppins w-100 border-0 bg-transparent text-start d-flex align-items-center justify-content-between cursor-pointer"
                onClick={() => setSubOpen(!subOpen)}
                title={item.etiqueta}
                aria-label={item.etiqueta}
            >
                <div className="d-flex align-items-center gap-2">
                    <span className="link-icon"><Icono /></span>
                    {!isSidebarCollapsed && <span className="link-text">{item.etiqueta}</span>}
                </div>
                {!isSidebarCollapsed && (
                    <span className={`chevron-submenu transition-transform ${subOpen ? 'rotate-180' : ''}`}>
                        <FaChevronDown size={11} />
                    </span>
                )}
            </button>

            {/* Sub-lista desplegable con los hijos (solo visible si el menú no está colapsado y está abierto) */}
            {!isSidebarCollapsed && subOpen && (
                <ul className="sidebar-submenu list-unstyled ps-4 py-1 mb-0">
                    {item.hijos.map((subItem) => {
                        const SubIcono = subItem.icono;
                        return (
                            <li key={subItem.ruta} className="submenu-item py-1">
                                <NavLink
                                    to={subItem.ruta}
                                    className={({ isActive }) =>
                                        `sidebar-sublink font-poppins text-decoration-none d-flex align-items-center gap-2 ${
                                            isActive ? 'text-light active' : 'text-muted'
                                        }`
                                    }
                                >
                                    {SubIcono && <SubIcono size={12} />}
                                    <span className="sublink-text small">{subItem.etiqueta}</span>
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            )}
        </li>
    );
}

export default function Sidebar({ onLogout }) {
    const { usuario } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Si por alguna razón no hay usuario, no se dibuja nada
    if (!usuario) return null;

    const items = menuPermitido(usuario);

    return (
        <aside className={`sidebar-origenes ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Botón para colapsar o expandir el menú lateral */}
            <button
                className="btn-toggle-sidebar"
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
                {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
            </button>

            {/* Cabecera: marca y subtítulo */}
            <div className="sidebar-header">
                {!isCollapsed && (
                    <div className="sidebar-brand-text">
                        <h1 className="font-origenes brand-title">Orígenes SV</h1>
                        <span className="brand-subtitle">Pastelería y cafetería</span>
                    </div>
                )}
            </div>

            <hr className="sidebar-divider" />

            {/* Navegación modular permitida según el rol */}
            <nav className="sidebar-nav">
                <ul className="list-unstyled mb-0">
                    {items.map((item) => (
                        <SidebarNavItem
                            key={item.ruta || item.etiqueta}
                            item={item}
                            isSidebarCollapsed={isCollapsed}
                        />
                    ))}
                </ul>
            </nav>

            {/* Pie de página: Cerrar sesión */}
            <div className="sidebar-footer mt-auto">
                <button className="logout-button" onClick={onLogout}>
                    <span className="link-icon"><FaSignOutAlt /></span>
                    {!isCollapsed && <span className="link-text">Cerrar sesión</span>}
                </button>
            </div>
        </aside>
    );
}