import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
// Servicios
import {
    obtenerEmpleados,
    crearEmpleado,
    actualizarEmpleado,
    desactivarEmpleado,
    cambiarPasswordEmpleado,
} from "../services/empleados.js";
import { getSucursales } from "../services/sucursales.js";
// Componentes generales de la UI del proyecto
import Button from "../components/Common/Button.jsx";
import StatusBadge from "../components/Common/StatusBadge.jsx";
import Modal from "../components/Common/Modal.jsx";
// Iconos de lucide-react
import {
    Users,
    Store,
    BarChart3,
    Search,
    Pencil,
    Ban,
    CheckCircle2,
    KeyRound,
} from "lucide-react";

export default function EmpleadosPage() {
    const { usuario } = useAuth();
    const { sucursalSeleccionada } = useOutletContext() || {};

    // Admin Global = rol ADMIN y sucursal_id null en su token
    const esAdminGlobal = usuario?.rol === "ADMIN" && usuario?.sucursal_id == null;

    // Estados principales de datos
    const [empleados, setEmpleados] = useState([]);
    const [sucursales, setSucursales] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorGeneral, setErrorGeneral] = useState("");
    const [busqueda, setBusqueda] = useState("");

    // ID de la sucursal activa
    const sucursalActivaId = esAdminGlobal
        ? (sucursalSeleccionada?.id ?? sucursales[0]?.id ?? null)
        : (usuario?.sucursal_id ?? null);

    // ESTADOS CONTROLADORES DE MODALES
    const [modalAgregar, setModalAgregar] = useState(false);
    const [modalEditar, setModalEditar] = useState(false);
    const [modalEstado, setModalEstado] = useState(false); // Sirve tanto para deshabilitar como para habilitar
    const [modalPassword, setModalPassword] = useState(false);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);

    // Estados de carga y error en modales
    const [guardando, setGuardando] = useState(false);
    const [errorModal, setErrorModal] = useState("");

    // CAMPOS DEL FORMULARIO: CREAR NUEVO EMPLEADO
    const [nombreNuevo, setNombreNuevo] = useState("");
    const [emailNuevo, setEmailNuevo] = useState("");
    const [passwordNuevo, setPasswordNuevo] = useState("");
    const [cargoNuevo, setCargoNuevo] = useState("BARISTA");
    const [rolNuevo, setRolNuevo] = useState("EMPLEADO");
    const [sucursalNuevoId, setSucursalNuevoId] = useState("");
    const [salarioNuevo, setSalarioNuevo] = useState("");

    // CAMPOS DEL FORMULARIO: EDITAR EMPLEADO
    const [nombreEdit, setNombreEdit] = useState("");
    const [emailEdit, setEmailEdit] = useState("");
    const [cargoEdit, setCargoEdit] = useState("CAJERO");
    const [rolEdit, setRolEdit] = useState("EMPLEADO");
    const [sucursalEditId, setSucursalEditId] = useState("");
    const [salarioEdit, setSalarioEdit] = useState("");

    // CAMPOS DEL FORMULARIO: CAMBIAR CONTRASEÑA
    const [nuevaPassword, setNuevaPassword] = useState("");
    const [confirmarPassword, setConfirmarPassword] = useState("");

    // ==========================================
    // 1. CARGAR SUCURSALES ACTIVAS
    // ==========================================
    useEffect(() => {
        let activo = true;
        getSucursales()
            .then((data) => {
                if (activo) {
                    const lista = Array.isArray(data) ? data : data?.sucursales || [];
                    setSucursales(lista);
                }
            })
            .catch((err) => console.error("Error al cargar sucursales:", err));

        return () => {
            activo = false;
        };
    }, []);

    // ==========================================
    // 2. CARGAR EMPLEADOS SEGÚN LA SUCURSAL ACTIVA
    // ==========================================
    async function cargarEmpleados() {
        if (!sucursalActivaId) return;

        try {
            setCargando(true);
            setErrorGeneral("");
            const data = await obtenerEmpleados(sucursalActivaId);
            const lista = Array.isArray(data) ? data : data?.empleados || [];
            setEmpleados(lista);
        } catch (err) {
            setErrorGeneral(err.message || "Error al cargar la lista de empleados.");
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarEmpleados();
    }, [sucursalActivaId]);

    // ==========================================
    // HELPERS DE FORMATO Y PERÍODO
    // ==========================================
    function obtenerIniciales(nombreCompleto = "") {
        const partes = nombreCompleto.trim().split(" ");
        if (partes.length >= 2) {
            return (partes[0][0] + partes[1][0]).toUpperCase();
        }
        return nombreCompleto.substring(0, 2).toUpperCase() || "EM";
    }

    function obtenerNombreSucursal(emp) {
        if (emp.sucursales?.nombre) return emp.sucursales.nombre;
        if (emp.sucursal?.nombre) return emp.sucursal.nombre;
        if (typeof emp.sucursal === "string") return emp.sucursal;
        const encontrada = sucursales.find((s) => s.id === emp.sucursal_id);
        return encontrada ? encontrada.nombre : "Sucursal asignada";
    }

    function obtenerSalario(emp) {
        return Number(emp.salario_base ?? emp.salarioBase ?? 0);
    }

    const hoy = new Date();
    const numeroQuincena = hoy.getDate() <= 15 ? "1." : "2.";
    const mesActual = hoy.toLocaleString("es-SV", { month: "long" });

    const empleadosActivos = empleados.filter((e) => e.activo).length;
    const empleadosInactivos = empleados.filter((e) => !e.activo).length;

    const empleadosFiltrados = empleados.filter((emp) => {
        const sucursalTexto = obtenerNombreSucursal(emp).toLowerCase();
        const termino = busqueda.toLowerCase();
        return (
            emp.nombre?.toLowerCase().includes(termino) ||
            emp.cargo?.toLowerCase().includes(termino) ||
            sucursalTexto.includes(termino)
        );
    });

    // ==========================================
    // ACCIÓN 1: CREAR EMPLEADO (POST)
    // ==========================================
    function abrirModalAgregar() {
        const idPorDefecto = sucursalActivaId || sucursales[0]?.id || "";
        setNombreNuevo("");
        setEmailNuevo("");
        setPasswordNuevo("");
        setCargoNuevo("BARISTA");
        setRolNuevo("EMPLEADO");
        setSucursalNuevoId(String(idPorDefecto));
        setSalarioNuevo("");
        setErrorModal("");
        setModalAgregar(true);
    }

    function handleCambioRolNuevo(nuevoRol) {
        setRolNuevo(nuevoRol);
        if (nuevoRol === "ADMIN") {
            setCargoNuevo("GERENTE");
        } else if (nuevoRol === "RRHH") {
            setCargoNuevo("RRHH");
        } else if (nuevoRol === "EMPLEADO" && (cargoNuevo === "GERENTE" || cargoNuevo === "RRHH") && !esAdminGlobal) {
            setCargoNuevo("BARISTA");
        }
    }

    async function handleAgregarEmpleado() {
        if (!nombreNuevo.trim() || !emailNuevo.trim() || !passwordNuevo || !salarioNuevo) {
            setErrorModal("Completa todos los campos obligatorios.");
            return;
        }

        if (passwordNuevo.length < 8 || passwordNuevo.length > 72) {
            setErrorModal("La contraseña debe tener entre 8 y 72 caracteres.");
            return;
        }

        const sucursalFinalId = esAdminGlobal
            ? Number(sucursalNuevoId)
            : Number(sucursalActivaId);

        if (!sucursalFinalId || sucursalFinalId <= 0) {
            setErrorModal("Debes seleccionar una sucursal válida.");
            return;
        }

        try {
            setGuardando(true);
            setErrorModal("");

            const payload = {
                nombre: nombreNuevo.trim(),
                email: emailNuevo.trim().toLowerCase(),
                password: passwordNuevo,
                rol: esAdminGlobal ? rolNuevo : "EMPLEADO",
                cargo: cargoNuevo,
                sucursal_id: sucursalFinalId,
                salario_base: parseFloat(salarioNuevo),
            };

            await crearEmpleado(payload);
            await cargarEmpleados();
            setModalAgregar(false);
        } catch (err) {
            setErrorModal(err.message || "No se pudo registrar el empleado.");
        } finally {
            setGuardando(false);
        }
    }

    // ==========================================
    // ACCIÓN 2: EDITAR EMPLEADO (PUT)
    // ==========================================
    function abrirModalEditar(item) {
        setEmpleadoSeleccionado(item);
        setNombreEdit(item.nombre || "");
        setEmailEdit(item.email || "");
        setCargoEdit(item.cargo || "CAJERO");
        setRolEdit(item.rol || "EMPLEADO");
        setSucursalEditId(String(item.sucursal_id || sucursalActivaId || ""));
        setSalarioEdit(obtenerSalario(item));
        setErrorModal("");
        setModalEditar(true);
    }

    async function handleGuardarEdicion() {
        if (!empleadoSeleccionado) return;

        if (!nombreEdit.trim() || !emailEdit.trim()) {
            setErrorModal("El nombre y el correo electrónico son obligatorios.");
            return;
        }

        try {
            setGuardando(true);
            setErrorModal("");

            const payload = {
                nombre: nombreEdit.trim(),
                email: emailEdit.trim().toLowerCase(),
                cargo: cargoEdit,
                salario_base: Number(salarioEdit),
            };

            if (esAdminGlobal) {
                payload.rol = rolEdit;
                if (sucursalEditId) {
                    payload.sucursal_id = Number(sucursalEditId);
                }
            }

            await actualizarEmpleado(empleadoSeleccionado.id, payload, sucursalActivaId);
            await cargarEmpleados();
            setModalEditar(false);
        } catch (err) {
            setErrorModal(err.message || "Error al actualizar los datos del empleado.");
        } finally {
            setGuardando(false);
        }
    }

    // ==========================================
    // ACCIÓN 3: CAMBIAR CONTRASEÑA (PATCH)
    // ==========================================
    function abrirModalPassword(item) {
        setEmpleadoSeleccionado(item);
        setNuevaPassword("");
        setConfirmarPassword("");
        setErrorModal("");
        setModalPassword(true);
    }

    async function handleGuardarPassword() {
        if (!empleadoSeleccionado) return;

        if (nuevaPassword.length < 8 || nuevaPassword.length > 72) {
            setErrorModal("La nueva contraseña debe tener entre 8 y 72 caracteres.");
            return;
        }

        if (nuevaPassword !== confirmarPassword) {
            setErrorModal("Las contraseñas no coinciden.");
            return;
        }

        try {
            setGuardando(true);
            setErrorModal("");
            await cambiarPasswordEmpleado(empleadoSeleccionado.id, nuevaPassword, sucursalActivaId);
            setModalPassword(false);
        } catch (err) {
            setErrorModal(err.message || "No se pudo actualizar la contraseña.");
        } finally {
            setGuardando(false);
        }
    }

    // ==========================================
    // ACCIÓN 4: HABILITAR O DESHABILITAR EMPLEADO
    // ==========================================
    function abrirModalEstado(item) {
        setEmpleadoSeleccionado(item);
        setErrorModal("");
        setModalEstado(true);
    }

    async function handleConfirmarCambioEstado() {
        if (!empleadoSeleccionado) return;

        try {
            setGuardando(true);
            setErrorModal("");

            if (empleadoSeleccionado.activo) {
                // Deshabilitar usando DELETE /empleados/desactivar/:id
                await desactivarEmpleado(empleadoSeleccionado.id, sucursalActivaId);
            } else {
                // Volver a habilitar usando PUT /empleados/:id con { activo: true }
                await actualizarEmpleado(empleadoSeleccionado.id, { activo: true }, sucursalActivaId);
            }

            await cargarEmpleados();
            setModalEstado(false);
        } catch (err) {
            setErrorModal(
                err.message ||
                (empleadoSeleccionado.activo
                    ? "No se pudo deshabilitar al empleado."
                    : "No se pudo habilitar al empleado.")
            );
        } finally {
            setGuardando(false);
        }
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
                    onClick={abrirModalAgregar}
                />
            </header>

            {/* ALERTA DE ERROR GENERAL */}
            {errorGeneral && (
                <div className="alert alert-danger mb-4" role="alert">
                    {errorGeneral}
                </div>
            )}

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
                            <span className="kpi-subtext">
                                {empleadosInactivos} {empleadosInactivos === 1 ? "empleado inactivo" : "empleados inactivos"}
                            </span>
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
                            <h2 className="h3 kpi-value mb-1">{esAdminGlobal ? sucursales.length : 1}</h2>
                            <span className="kpi-subtext">
                                {esAdminGlobal
                                    ? sucursalSeleccionada?.nombre || "Todas las sedes"
                                    : sucursalSeleccionada?.nombre || "Sucursal asignada"}
                            </span>
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
                                {numeroQuincena}
                                <sup>a</sup>
                            </h2>
                            <span className="kpi-subtext">Quincena de {mesActual}</span>
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
                        {cargando ? (
                            <tr>
                                <td colSpan={6} className="inventario-mensaje text-center">
                                    Cargando personal de la sucursal...
                                </td>
                            </tr>
                        ) : empleadosFiltrados.length === 0 ? (
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
                                            <div className="employee-avatar">{obtenerIniciales(item.nombre)}</div>
                                            <div>
                                                <div className="inventario-nombre">{item.nombre}</div>
                                                <div className={"d-flex flex-column"}>
                                                    <span className="employee-role">Rol: {item.rol}</span>
                                                    <span className="employee-role">Email: {item.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="cargo-badge">{item.cargo}</span>
                                    </td>
                                    <td>{obtenerNombreSucursal(item)}</td>
                                    <td className="inventario-nombre">${obtenerSalario(item).toFixed(2)}</td>
                                    <td>
                                        <StatusBadge
                                            text={item.activo ? "Activo" : "Inactivo"}
                                            variant={item.activo ? "success" : "secondary"}
                                        />
                                    </td>
                                    <td>
                                        <div className="inventario-acciones">
                                            {/* 1. EDITAR DATOS */}
                                            <button
                                                type="button"
                                                className="inventario-icono inventario-icono--editar"
                                                title="Editar empleado"
                                                aria-label={`Editar ${item.nombre}`}
                                                onClick={() => abrirModalEditar(item)}
                                            >
                                                <Pencil size={18} />
                                            </button>

                                            {/* 2. CAMBIAR CONTRASEÑA */}
                                            <button
                                                type="button"
                                                className="inventario-icono inventario-icono--editar"
                                                title="Cambiar contraseña"
                                                aria-label={`Cambiar contraseña de ${item.nombre}`}
                                                onClick={() => abrirModalPassword(item)}
                                            >
                                                <KeyRound size={18} />
                                            </button>

                                            {/* 3. HABILITAR / DESHABILITAR DINÁMICO */}
                                            {item.activo ? (
                                                <button
                                                    type="button"
                                                    className="inventario-icono inventario-icono--eliminar"
                                                    title="Deshabilitar empleado"
                                                    aria-label={`Deshabilitar ${item.nombre}`}
                                                    onClick={() => abrirModalEstado(item)}
                                                    disabled={item.id === usuario?.id}
                                                >
                                                    <Ban size={18} />
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="inventario-icono inventario-icono--editar"
                                                    style={{ color: "#198754" }}
                                                    title="Volver a habilitar empleado"
                                                    aria-label={`Habilitar ${item.nombre}`}
                                                    onClick={() => abrirModalEstado(item)}
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* MODAL 1: CREAR EMPLEADO */}
            <Modal
                show={modalAgregar}
                title="Agregar nuevo empleado"
                onClose={() => {
                    if (!guardando) setModalAgregar(false);
                }}
                footer={
                    <>
                        <Button
                            text="Cancelar"
                            variant="outline-secondary"
                            disabled={guardando}
                            onClick={() => setModalAgregar(false)}
                        />
                        <Button
                            text={guardando ? "Registrando..." : "Registrar empleado"}
                            variant="secondary"
                            disabled={
                                guardando ||
                                !nombreNuevo.trim() ||
                                !emailNuevo.trim() ||
                                !passwordNuevo ||
                                !salarioNuevo
                            }
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

                <div className="row g-2 mb-3">
                    <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">Correo electrónico *</label>
                        <input
                            type="email"
                            className="form-control"
                            placeholder="ejemplo@origenes.sv"
                            value={emailNuevo}
                            onChange={(e) => setEmailNuevo(e.target.value)}
                        />
                    </div>

                    <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">Contraseña inicial *</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Mínimo 8 caracteres"
                            value={passwordNuevo}
                            onChange={(e) => setPasswordNuevo(e.target.value)}
                        />
                    </div>
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
                            {esAdminGlobal && <option value="GERENTE">GERENTE</option>}
                            {esAdminGlobal && <option value="RRHH">RRHH</option>}
                        </select>
                    </div>

                    <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">Rol de sistema *</label>
                        <select
                            className="form-select"
                            value={rolNuevo}
                            onChange={(e) => handleCambioRolNuevo(e.target.value)}
                            disabled={!esAdminGlobal}
                        >
                            <option value="EMPLEADO">EMPLEADO</option>
                            {esAdminGlobal && <option value="RRHH">RRHH</option>}
                            {esAdminGlobal && <option value="ADMIN">ADMIN</option>}
                        </select>
                    </div>
                </div>

                <div className="row g-2 mb-3">
                    <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">Sucursal asignada *</label>
                        <select
                            className="form-select"
                            value={sucursalNuevoId}
                            onChange={(e) => setSucursalNuevoId(e.target.value)}
                            disabled={!esAdminGlobal}
                        >
                            {sucursales.map((suc) => (
                                <option key={suc.id} value={suc.id}>
                                    {suc.nombre}
                                </option>
                            ))}
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

                {errorModal && (
                    <div className="alert alert-danger mb-0" role="alert">
                        {errorModal}
                    </div>
                )}
            </Modal>

            {/* MODAL 2: EDITAR EMPLEADO */}
            {/* MODAL 2: EDITAR EMPLEADO */}
            <Modal
                show={modalEditar}
                title="Editar empleado"
                onClose={() => {
                    if (!guardando) setModalEditar(false);
                }}
                footer={
                    <>
                        <Button
                            text="Cancelar"
                            variant="outline-secondary"
                            disabled={guardando}
                            onClick={() => setModalEditar(false)}
                        />
                        <Button
                            text={guardando ? "Guardando..." : "Guardar cambios"}
                            variant="secondary"
                            disabled={guardando || !nombreEdit.trim() || !emailEdit.trim()}
                            onClick={handleGuardarEdicion}
                        />
                    </>
                }
            >
                <div className="mb-3">
                    <label className="form-label fw-bold">Nombre completo *</label>
                    <input
                        type="text"
                        className="form-control"
                        value={nombreEdit}
                        onChange={(e) => setNombreEdit(e.target.value)}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label fw-bold">Correo electrónico *</label>
                    <input
                        type="email"
                        className="form-control"
                        value={emailEdit}
                        onChange={(e) => setEmailEdit(e.target.value)}
                    />
                </div>

                <div className="row g-2 mb-3">
                    <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">Cargo *</label>
                        <select
                            className="form-select"
                            value={cargoEdit}
                            onChange={(e) => setCargoEdit(e.target.value)}
                        >
                            <option value="CAJERO">CAJERO</option>
                            <option value="BARISTA">BARISTA</option>
                            {esAdminGlobal && <option value="GERENTE">GERENTE</option>}
                            {esAdminGlobal && <option value="RRHH">RRHH</option>}
                        </select>
                    </div>

                    <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">Rol de sistema *</label>
                        <select
                            className="form-select"
                            value={rolEdit}
                            onChange={(e) => setRolEdit(e.target.value)}
                            disabled={!esAdminGlobal || empleadoSeleccionado?.id === usuario?.id}
                        >
                            <option value="EMPLEADO">EMPLEADO</option>
                            {esAdminGlobal && <option value="RRHH">RRHH</option>}
                            {esAdminGlobal && <option value="ADMIN">ADMIN</option>}
                        </select>
                    </div>
                </div>

                <div className="row g-2 mb-3">
                    <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">Sucursal</label>
                        <select
                            className="form-select"
                            value={sucursalEditId}
                            onChange={(e) => setSucursalEditId(e.target.value)}
                            disabled={!esAdminGlobal}
                        >
                            {sucursales.map((suc) => (
                                <option key={suc.id} value={suc.id}>
                                    {suc.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-12 col-md-6">
                        <label className="form-label fw-bold">Salario Base ($)</label>
                        <input
                            type="number"
                            className="form-control"
                            step="0.01"
                            min="0"
                            value={salarioEdit}
                            onChange={(e) => setSalarioEdit(e.target.value)}
                        />
                    </div>
                </div>

                {errorModal && (
                    <div className="alert alert-danger mb-0" role="alert">
                        {errorModal}
                    </div>
                )}
            </Modal>

            {/* MODAL 3: CAMBIAR CONTRASEÑA */}
            <Modal
                show={modalPassword}
                title={`Cambiar contraseña — ${empleadoSeleccionado?.nombre || ""}`}
                onClose={() => {
                    if (!guardando) setModalPassword(false);
                }}
                footer={
                    <>
                        <Button
                            text="Cancelar"
                            variant="outline-secondary"
                            disabled={guardando}
                            onClick={() => setModalPassword(false)}
                        />
                        <Button
                            text={guardando ? "Actualizando..." : "Actualizar contraseña"}
                            variant="secondary"
                            disabled={guardando || !nuevaPassword || !confirmarPassword}
                            onClick={handleGuardarPassword}
                        />
                    </>
                }
            >
                <div className="mb-3">
                    <label className="form-label fw-bold">Nueva contraseña *</label>
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Mínimo 8 caracteres"
                        value={nuevaPassword}
                        onChange={(e) => setNuevaPassword(e.target.value)}
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label fw-bold">Confirmar nueva contraseña *</label>
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Repite la contraseña"
                        value={confirmarPassword}
                        onChange={(e) => setConfirmarPassword(e.target.value)}
                    />
                </div>

                {errorModal && (
                    <div className="alert alert-danger mb-0" role="alert">
                        {errorModal}
                    </div>
                )}
            </Modal>

            {/* MODAL 4: HABILITAR / DESHABILITAR EMPLEADO */}
            <Modal
                show={modalEstado}
                title={empleadoSeleccionado?.activo ? "Deshabilitar empleado" : "Habilitar empleado"}
                onClose={() => {
                    if (!guardando) setModalEstado(false);
                }}
                footer={
                    <>
                        <Button
                            text="Cancelar"
                            variant="outline-secondary"
                            disabled={guardando}
                            onClick={() => setModalEstado(false)}
                        />
                        <Button
                            text={
                                guardando
                                    ? "Procesando..."
                                    : empleadoSeleccionado?.activo
                                        ? "Deshabilitar"
                                        : "Habilitar"
                            }
                            variant={empleadoSeleccionado?.activo ? "danger" : "success"}
                            disabled={guardando}
                            onClick={handleConfirmarCambioEstado}
                        />
                    </>
                }
            >
                {empleadoSeleccionado?.activo ? (
                    <>
                        <p>
                            ¿Estás seguro de que deseas deshabilitar al empleado{" "}
                            <strong>{empleadoSeleccionado?.nombre}</strong>?
                        </p>
                        <div className="alert alert-warning mb-0">
                            El empleado pasará a estado <strong>Inactivo</strong> y no podrá iniciar sesión, pero conservará su historial en el sistema.
                        </div>
                    </>
                ) : (
                    <>
                        <p>
                            ¿Deseas volver a habilitar al empleado{" "}
                            <strong>{empleadoSeleccionado?.nombre}</strong>?
                        </p>
                        <div className="alert alert-success mb-0">
                            El empleado pasará a estado <strong>Activo</strong> y podrá volver a acceder al sistema e incluirse en planillas.
                        </div>
                    </>
                )}

                {errorModal && (
                    <div className="alert alert-danger mt-3 mb-0" role="alert">
                        {errorModal}
                    </div>
                )}
            </Modal>
        </div>
    );
}