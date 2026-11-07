import { useState } from 'react';
import {
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    Button
} from 'reactstrap';
import {
    FaStore,
    FaChevronDown,
    FaBell,
    FaSignOutAlt
} from 'react-icons/fa';
import logoOrigenes from "../assets/logo-transparente.png";

export default function Navbar({
                                   usuario,
                                   titulo = "Inicio",
                                   subtitulo = "Resumen de tu turno y acciones prioritarias",
                                   cajaAbierta = false,
                                   sucursales = ["Escalón", "San Benito", "Sucursal Central"],
                                   sucursalActual = "Escalón",
                                   onCambiarSucursal
                               }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

    // Obtener iniciales para el avatar
    const obtenerIniciales = (nombre) => {
        if (!nombre) return "U";
        const partes = nombre.trim().split(" ");
        if (partes.length >= 2) {
            return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
        }
        return nombre.substring(0, 2).toUpperCase();
    };

    // Resolver nombre de la sucursal
    const nombreSucursal =
        typeof usuario?.sucursal === 'object'
            ? usuario?.sucursal?.nombre
            : usuario?.sucursal || sucursalActual;

    const rolMostrar = usuario?.cargo || usuario?.rol || "Rol no definido";

    return (
        <header className="navbar-origenes d-flex align-items-center justify-content-between px-4 py-3 bg-cream border-bottom border-light-subtle">
            {/* 1. Título y Subtítulo a la izquierda */}
            <div className={"d-flex align-items-center gap-2"}>
                <div>
                    <img
                        src={logoOrigenes}
                        alt="Postre Orígenes"
                        style={{ width: '65px', height: '50px' }}
                        className="img-fluid logo-glow"
                    />
                </div>
                <div>
                    <h1 className="h3 font-origenes text-dark-brown mb-0 fw-bold">
                        {titulo}
                    </h1>
                    {subtitulo && (
                        <p className="small text-muted mb-0 fw-light">
                            {subtitulo}
                        </p>
                    )}
                </div>
            </div>

            {/* 2. Controles de la derecha */}
            <div className="d-flex align-items-center gap-3">
                {/* Selector de Sucursal */}
                <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
                    <DropdownToggle
                        tag="button"
                        className="btn btn-outline-brown d-flex align-items-center gap-2 px-3 py-2 rounded-4 bg-white shadow-sm"
                    >
                        <FaStore className="text-brown" size={14} />
                        <span className="fw-medium text-dark-brown small">
              {nombreSucursal}
            </span>
                        <FaChevronDown className="text-muted ms-1" size={10} />
                    </DropdownToggle>
                    <DropdownMenu end className="shadow-sm border-0 rounded-3 mt-1">
                        {sucursales.map((suc) => (
                            <DropdownItem
                                key={suc}
                                onClick={() => onCambiarSucursal && onCambiarSucursal(suc)}
                                className="small py-2"
                            >
                                {suc}
                            </DropdownItem>
                        ))}
                    </DropdownMenu>
                </Dropdown>

                {/* Status Badge de Caja (Abierta / Cerrada) */}
                <div
                    className={`badge-caja d-flex align-items-center gap-2 px-3 py-2 rounded-pill small ${
                        cajaAbierta ? "bg-success-subtle text-success" : "bg-pink-subtle text-danger-brown"
                    }`}
                >
          <span
              className={`dot-status ${cajaAbierta ? "bg-success" : "bg-danger-brown"}`}
          />
                    <span className="fw-semibold">
            {cajaAbierta ? "Caja abierta" : "Caja cerrada"}
          </span>
                </div>

                {/* Separador vertical */}
                <div className="vr mx-1 opacity-25" style={{ height: "28px" }} />

                {/* Perfil de Usuario con Avatar e Iniciales */}
                <div className="d-flex align-items-center gap-2 ps-1">
                    <div className="avatar-circle d-flex align-items-center justify-content-center text-dark-brown fw-semibold">
                        {obtenerIniciales(usuario?.nombre)}
                    </div>
                    <div className="d-none d-sm-block text-start lh-sm">
                        <div className="fw-bold text-dark-brown small font-poppins">
                            {usuario?.nombre || "María López"}
                        </div>
                        <div className="text-muted extra-small font-poppins">
                            {rolMostrar}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}