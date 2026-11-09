import { useState } from "react";
// Componentes generales de la UI del proyecto
import Button from "../components/Common/Button.jsx";
import StatusBadge from "../components/Common/StatusBadge.jsx";
import Modal from "../components/Common/Modal.jsx";
// Iconos de lucide-react
import { Users, Store, BarChart3, Search, Pencil, Ban } from "lucide-react";

// DATOS MOCK DE PRUEBA PARA EL DISEÑO
const empleadosMock = [
    {
        id: 1,
        iniciales: "AM",
        nombre: "Ana Martínez",
        email: "ana.martinez@origenes.sv",
        rol: "EMPLEADO",
        cargo: "CAJERO",
        sucursal: "Escalón",
        salarioBase: 700.0,
        activo: true,
    },
    {
        id: 2,
        iniciales: "CH",
        nombre: "Carlos Hernández",
        email: "carlos.hernandez@origenes.sv",
        rol: "EMPLEADO",
        cargo: "BARISTA",
        sucursal: "Escalón",
        salarioBase: 650.0,
        activo: true,
    },
    {
        id: 3,
        iniciales: "SR",
        nombre: "Sofía Ramírez",
        email: "sofia.ramirez@origenes.sv",
        rol: "EMPLEADO",
        cargo: "GERENTE",
        sucursal: "Santa Elena",
        salarioBase: 1450.0,
        activo: true,
    },
    {
        id: 4,
        iniciales: "ML",
        nombre: "María López",
        email: "maria.lopez@origenes.sv",
        rol: "RRHH",
        cargo: "RRHH",
        sucursal: "Oficina central",
        salarioBase: 1200.0,
        activo: true,
    },
    {
        id: 5,
        iniciales: "DF",
        nombre: "Diego Flores",
        email: "diego.flores@origenes.sv",
        rol: "EMPLEADO",
        cargo: "BARISTA",
        sucursal: "San Benito",
        salarioBase: 625.0,
        activo: false,
    },
];

export default function EmpleadosPage() {
    // Estado local para los registros visuales
    const [empleados, setEmpleados] = useState(empleadosMock);
    const [busqueda, setBusqueda] = useState("");

    // ESTADOS CONTROLADORES DE MODALES
    const [modalAgregar, setModalAgregar] = useState(false);
    const [modalEditar, setModalEditar] = useState(false);
    const [modalDeshabilitar, setModalDeshabilitar] = useState(false);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);

    // CAMPOS DEL FORMULARIO: CREAR NUEVO EMPLEADO
    const [nombreNuevo, setNombreNuevo] = useState("");
    const [emailNuevo, setEmailNuevo] = useState("");
    const [cargoNuevo, setCargoNuevo] = useState("BARISTA");
    const [rolNuevo, setRolNuevo] = useState("EMPLEADO");
    const [sucursalNuevo, setSucursalNuevo] = useState("Escalón");
    const [salarioNuevo, setSalarioNuevo] = useState("");

    // CAMPOS DEL FORMULARIO: EDITAR EMPLEADO
    const [nombreEdit, setNombreEdit] = useState("");
    const [cargoEdit, setCargoEdit] = useState("CAJERO");
    const [sucursalEdit, setSucursalEdit] = useState("Escalón");
    const [salarioEdit, setSalarioEdit] = useState("");

    // Métricas calculadas para las tarjetas superiores (KPIs)
    const empleadosActivos = empleados.filter((e) => e.activo).length;
    const empleadosInactivos = empleados.filter((e) => !e.activo).length;

    // Filtrado de la lista en tiempo real por el término de búsqueda
    const empleadosFiltrados = empleados.filter(
        (emp) =>
            emp.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            emp.cargo.toLowerCase().includes(busqueda.toLowerCase()) ||
            emp.sucursal.toLowerCase().includes(busqueda.toLowerCase())
    );

    // Generador auxiliar de iniciales para el avatar
    function obtenerIniciales(nombreCompleto) {
        const partes = nombreCompleto.trim().split(" ");
        if (partes.length >= 2) {
            return (partes[0][0] + partes[1][0]).toUpperCase();
        }
        return nombreCompleto.substring(0, 2).toUpperCase();
    }

    // ACCIÓN DE DISEÑO: AGREGAR EMPLEADO EN ESTADO LOCAL
    function handleAgregarEmpleado() {
        if (!nombreNuevo.trim() || !emailNuevo.trim() || !salarioNuevo) return;

        const nuevo = {
            id: Date.now(),
            iniciales: obtenerIniciales(nombreNuevo),
            nombre: nombreNuevo.trim(),
            email: emailNuevo.trim(),
            rol: rolNuevo,
            cargo: cargoNuevo,
            sucursal: sucursalNuevo,
            salarioBase: parseFloat(salarioNuevo),
            activo: true,
        };

        setEmpleados([nuevo, ...empleados]);
        setModalAgregar(false);
    }

    // ACCIÓN DE DISEÑO: ABRIR Y EDITAR EMPLEADO EN ESTADO LOCAL
    function abrirModalEditar(item) {
        setEmpleadoSeleccionado(item);
        setNombreEdit(item.nombre);
        setCargoEdit(item.cargo);
        setSucursalEdit(item.sucursal);
        setSalarioEdit(item.salarioBase);
        setModalEditar(true);
    }

    function handleGuardarEdicion() {
        if (!empleadoSeleccionado) return;
        setEmpleados((anteriores) =>
            anteriores.map((emp) =>
                emp.id === empleadoSeleccionado.id
                    ? {
                        ...emp,
                        nombre: nombreEdit,
                        cargo: cargoEdit,
                        sucursal: sucursalEdit,
                        salarioBase: Number(salarioEdit),
                        iniciales: obtenerIniciales(nombreEdit),
                    }
                    : emp
            )
        );
        setModalEditar(false);
    }

    // ACCIÓN DE DISEÑO: DESHABILITAR EMPLEADO EN ESTADO LOCAL
    function abrirModalDeshabilitar(item) {
        setEmpleadoSeleccionado(item);
        setModalDeshabilitar(true);
    }

    function handleConfirmarDeshabilitar() {
        if (!empleadoSeleccionado) return;
        setEmpleados((anteriores) =>
            anteriores.map((emp) =>
                emp.id === empleadoSeleccionado.id ? { ...emp, activo: false } : emp
            )
        );
        setModalDeshabilitar(false);
    }

    return (
        <div className="inventario-page" style={{ minWidth: 0, flex: "1 1 0%", maxWidth: "100%" }}>
            {/* ENCABEZADO SUPERIOR */}
            <header className="inventario-header">
                <div>
                   <h1 className="inventario-titulo">Equipo de Orígenes</h1>
                    <p className="inventario-subtitulo">
                        Gestiona personal, cargos y asignaciones por sucursal.
                    </p>
                </div>

                <Button
                    text="+ Agregar empleado"
                    variant="secondary"
                    className="text-white"
                    onClick={() => {
                        setNombreNuevo("");
                        setEmailNuevo("");
                        setSalarioNuevo("");
                        setModalAgregar(true);
                    }}
                />
            </header>

            {/* TARJETAS KPI SUPERIORES */}
            <div className="row g-3 mb-4 w-100 mx-0">
                <div className="col-12 col-md-4 px-2">
                    <div className="card kpi-card w-100 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="kpi-label">Personal activo</span>
                            <div className="kpi-icon-wrapper kpi-icon-wrapper--users">
                                <Users size={18} />
                            </div>
                        </div>
                        <div>
                            <h2 className="h3 kpi-value mb-1">{empleadosActivos}</h2>
                            <span className="kpi-subtext">{empleadosInactivos} empleado inactivo</span>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-4 px-2">
                    <div className="card kpi-card w-100 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="kpi-label">Sucursales asignadas</span>
                            <div className="kpi-icon-wrapper kpi-icon-wrapper--stores">
                                <Store size={18} />
                            </div>
                        </div>
                        <div>
                            <h2 className="h3 kpi-value mb-1">3</h2>
                            <span className="kpi-subtext">Más oficina central</span>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-md-4 px-2">
                    <div className="card kpi-card w-100 h-100">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="kpi-label">Período actual</span>
                            <div className="kpi-icon-wrapper kpi-icon-wrapper--period">
                                <BarChart3 size={18} />
                            </div>
                        </div>
                        <div>
                            <h2 className="h3 kpi-value mb-1">
                                1.<sup>a</sup>
                            </h2>
                            <span className="kpi-subtext">Quincena de junio</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* BARRA DE BÚSQUEDA */}
            <div className="mb-4 search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    className="form-control search-input"
                    placeholder="Buscar por nombre o cargo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            {/* TABLA SCROLLABLE CON ENCABEZADO FIJO Y COLUMNA DE ACCIONES */}
            <main className="inventario-contenido">
                <div className="inventario-tabla-contenedor" style={{ maxHeight: "608px", overflowY: "auto" }}>
                    <table className="inventario-tabla">
                        <thead style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#fff" }}>
                        <tr>
                            <th>Empleado</th>
                            <th>Cargo</th>
                            <th>Sucursal</th>
                            <th>Salario Mensual</th>
                            <th>Estado</th>
                            <th>Acción</th>
                        </tr>
                        </thead>
                        <tbody>
                        {empleadosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="inventario-mensaje text-center">
                                    No se encontraron empleados que coincidan con la búsqueda.
                                </td>
                            </tr>
                        ) : (
                            empleadosFiltrados.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="employee-avatar">{item.iniciales}</div>
                                            <div>
                                                <div className="inventario-nombre">{item.nombre}</div>
                                                <span className="employee-role">Rol: {item.rol}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="cargo-badge">{item.cargo}</span>
                                    </td>
                                    <td>{item.sucursal}</td>
                                    <td className="inventario-nombre">${item.salarioBase.toFixed(2)}</td>
                                    <td>
                                        <StatusBadge
                                            text={item.activo ? "Activo" : "Inactivo"}
                                            variant={item.activo ? "success" : "secondary"}
                                        />
                                    </td>
                                    <td>
                                        <div className="inventario-acciones">
                                            <button
                                                type="button"
                                                className="inventario-icono inventario-icono--editar"
                                                title="Editar empleado"
                                                aria-label={`Editar ${item.nombre}`}
                                                onClick={() => abrirModalEditar(item)}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                type="button"
                                                className="inventario-icono inventario-icono--eliminar"
                                                title="Deshabilitar empleado"
                                                aria-label={`Deshabilitar ${item.nombre}`}
                                                onClick={() => abrirModalDeshabilitar(item)}
                                                disabled={!item.activo}
                                            >
                                                <Ban size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* MODAL 1: CREAR EMPLEADO (DISEÑO Y FORMULARIO) */}
            <Modal
                show={modalAgregar}
                title="Agregar nuevo empleado"
                onClose={() => setModalAgregar(false)}
                footer={
                    <>
                        <Button
                            text="Cancelar"
                            variant="outline-secondary"
                            onClick={() => setModalAgregar(false)}
                        />
                        <Button
                            text="Registrar empleado"
                            variant="secondary"
                            disabled={!nombreNuevo.trim() || !emailNuevo.trim() || !salarioNuevo}
                            onClick={handleAgregarEmpleado}
                        />
                    </>
                }
            >
                <div className="mb-3">
                    <label className="form-label fw-bold">Nombre completo *</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. Susan Castillo"
                        value={nombreNuevo}
                        onChange={(e) => setNombreNuevo(e.target.value)}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label fw-bold">Correo electrónico *</label>
                    <input
                        type="email"
                        className="form-control"
                        placeholder="ejemplo@origenes.sv"
                        value={emailNuevo}
                        onChange={(e) => setEmailNuevo(e.target.value)}
                    />
                </div>

                <div className="row g-2 mb-3">
                    <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">Cargo *</label>
                        <select
                            className="form-select"
                            value={cargoNuevo}
                            onChange={(e) => setCargoNuevo(e.target.value)}
                        >
                            <option value="BARISTA">BARISTA</option>
                            <option value="CAJERO">CAJERO</option>
                            <option value="GERENTE">GERENTE</option>
                            <option value="RRHH">RRHH</option>
                        </select>
                    </div>

                    <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">Rol de sistema *</label>
                        <select
                            className="form-select"
                            value={rolNuevo}
                            onChange={(e) => setRolNuevo(e.target.value)}
                        >
                            <option value="EMPLEADO">EMPLEADO</option>
                            <option value="RRHH">RRHH</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>
                </div>

                <div className="row g-2 mb-3">
                    <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">Sucursal asignada *</label>
                        <select
                            className="form-select"
                            value={sucursalNuevo}
                            onChange={(e) => setSucursalNuevo(e.target.value)}
                        >
                            <option value="Escalón">Escalón</option>
                            <option value="Santa Elena">Santa Elena</option>
                            <option value="San Benito">San Benito</option>
                            <option value="Oficina central">Oficina central</option>
                        </select>
                    </div>

                    <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">Salario Base Mensual ($) *</label>
                        <input
                            type="number"
                            className="form-control"
                            placeholder="Ej. 600.00"
                            step="0.01"
                            min="0"
                            value={salarioNuevo}
                            onChange={(e) => setSalarioNuevo(e.target.value)}
                        />
                    </div>
                </div>
            </Modal>

            {/* MODAL 2: EDITAR EMPLEADO */}
            <Modal
                show={modalEditar}
                title="Editar empleado"
                onClose={() => setModalEditar(false)}
                footer={
                    <>
                        <Button
                            text="Cancelar"
                            variant="outline-secondary"
                            onClick={() => setModalEditar(false)}
                        />
                        <Button
                            text="Guardar cambios"
                            variant="secondary"
                            onClick={handleGuardarEdicion}
                        />
                    </>
                }
            >
                <div className="mb-3">
                    <label className="form-label">Nombre del empleado</label>
                    <input
                        type="text"
                        className="form-control"
                        value={nombreEdit}
                        onChange={(e) => setNombreEdit(e.target.value)}
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Cargo</label>
                    <select
                        className="form-select"
                        value={cargoEdit}
                        onChange={(e) => setCargoEdit(e.target.value)}
                    >
                        <option value="CAJERO">CAJERO</option>
                        <option value="BARISTA">BARISTA</option>
                        <option value="GERENTE">GERENTE</option>
                        <option value="RRHH">RRHH</option>
                    </select>
                </div>
                <div className="mb-3">
                    <label className="form-label">Sucursal</label>
                    <select
                        className="form-select"
                        value={sucursalEdit}
                        onChange={(e) => setSucursalEdit(e.target.value)}
                    >
                        <option value="Escalón">Escalón</option>
                        <option value="Santa Elena">Santa Elena</option>
                        <option value="San Benito">San Benito</option>
                        <option value="Oficina central">Oficina central</option>
                    </select>
                </div>
                <div className="mb-3">
                    <label className="form-label">Salario Base ($)</label>
                    <input
                        type="number"
                        className="form-control"
                        step="0.01"
                        value={salarioEdit}
                        onChange={(e) => setSalarioEdit(e.target.value)}
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Estado</label>
                    <select
                        className="form-select"
                        value={sucursalEdit}
                        onChange={(e) => setSucursalEdit(e.target.value)}
                    >
                        <option value="Escalón">Activo</option>
                        <option value="Santa Elena">Inactivo</option>
                    </select>
                </div>
            </Modal>

            {/* MODAL 3: DESHABILITAR EMPLEADO */}
            <Modal
                show={modalDeshabilitar}
                title="Deshabilitar empleado"
                onClose={() => setModalDeshabilitar(false)}
                footer={
                    <>
                        <Button
                            text="Cancelar"
                            variant="outline-secondary"
                            onClick={() => setModalDeshabilitar(false)}
                        />
                        <Button
                            text="Deshabilitar"
                            variant="danger"
                            onClick={handleConfirmarDeshabilitar}
                        />
                    </>
                }
            >
                <p>
                    ¿Estás seguro de que deseas deshabilitar al empleado{" "}
                    <strong>{empleadoSeleccionado?.nombre}</strong>?
                </p>
                <div className="alert alert-warning mb-0">
                    El empleado pasará a estado <strong>Inactivo</strong>, pero conservará su historial de registros en el sistema.
                </div>
            </Modal>
        </div>
    );
}