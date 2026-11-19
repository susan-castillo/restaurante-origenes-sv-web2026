import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Pencil, Ban, CheckCircle2, Receipt, Clock } from "lucide-react";
import { Alert, Col, Form, FormGroup, Input, Label, Row } from "reactstrap";
import Button from "../components/Common/Button.jsx";
import Card from "../components/Common/Card.jsx";
import Tabs from "../components/Common/Tabs.jsx";
import Modal from "../components/Common/Modal.jsx";
import StatusBadge from "../components/Common/StatusBadge.jsx";
import CompraForm from "../components/compras/CompraForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
    getResumenCompras,
    getProveedores,
    getCompras,
    pagarCompra
} from "../services/comprasService.js";
import { crearProveedor, actualizarProveedor, eliminarProveedor } from "../services/proveedoresService.js";

const moneda = new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD"
});

const conteo = new Intl.NumberFormat("es-SV");

const vistas = [
    { value: "compras", label: "Compras" },
    { value: "proveedores", label: "Proveedores" }
];

function formatearNit(valor) {
    const numeros = String(valor || "").replace(/\D/g, "").slice(0, 14);
    const partes = [];

    if (numeros.length > 0) partes.push(numeros.slice(0, 4));
    if (numeros.length > 4) partes.push(numeros.slice(4, 10));
    if (numeros.length > 10) partes.push(numeros.slice(10, 13));
    if (numeros.length > 13) partes.push(numeros.slice(13, 14));

    return partes.join("-");
}

function formatearFecha(fechaIso) {
    if (!fechaIso) return "—";
    return String(fechaIso).slice(0, 10);
}

export default function ComprasPage() {
    const { usuario } = useAuth();
    const { sucursalSeleccionada } = useOutletContext() || {};
    const sucursalId = sucursalSeleccionada?.id || usuario?.sucursal_id;

    const [vista, setVista] = useState("compras");
    const [formularioAbierto, setFormularioAbierto] = useState(false);
    const [confirmacion, setConfirmacion] = useState("");
    const [fin, setFin] = useState(() => new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()));
    const [inicio, setInicio] = useState(() => `${fin.slice(0, 7)}-01`);
    const [resultado, setResultado] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    // Estados del listado de facturas y pago
    const [compras, setCompras] = useState([]);
    const [cargandoCompras, setCargandoCompras] = useState(false);
    const [filtroPago, setFiltroPago] = useState("TODAS");
    const [compraAPagar, setCompraAPagar] = useState(null);
    const [pagandoCompra, setPagandoCompra] = useState(false);
    const [errorPago, setErrorPago] = useState("");

    // Estados de proveedores
    const [proveedores, setProveedores] = useState([]);
    const [cargandoProveedores, setCargandoProveedores] = useState(false);
    const [errorProveedores, setErrorProveedores] = useState("");
    const [busquedaProveedor, setBusquedaProveedor] = useState("");

    const [modalProveedor, setModalProveedor] = useState(false);
    const [proveedorEditando, setProveedorEditando] = useState(null);
    const [nombreProveedor, setNombreProveedor] = useState("");
    const [nitProveedor, setNitProveedor] = useState("");
    const [errorProveedor, setErrorProveedor] = useState("");
    const [guardandoProveedor, setGuardandoProveedor] = useState(false);

    const [proveedorEliminar, setProveedorEliminar] = useState(null);
    const [eliminandoProveedor, setEliminandoProveedor] = useState(null);
    const [errorEliminar, setErrorEliminar] = useState("");

    async function cargarListadoCompras() {
        try {
            setCargandoCompras(true);
            const lista = await getCompras(sucursalId);
            setCompras(Array.isArray(lista) ? lista : []);
        } catch (err) {
            console.error("Error al cargar compras:", err);
        } finally {
            setCargandoCompras(false);
        }
    }

    useEffect(() => {
        if (vista === "compras") {
            cargarListadoCompras();
        }
    }, [vista, sucursalId]);

    async function consultar(evento) {
        evento?.preventDefault();
        if (cargando) return;

        setResultado(null);

        if (!inicio || !fin || inicio > fin) {
            setError("Selecciona un rango válido. La fecha final debe ser igual o posterior a la inicial.");
            return;
        }

        setCargando(true);
        setError("");

        try {
            const datos = await getResumenCompras(inicio, fin, sucursalId);

            if (!datos?.resumen || !datos?.rango) {
                throw new Error("No se recibió el resumen de compras.");
            }

            setResultado(datos);
        } catch (err) {
            setError(err.message || "No se pudo consultar el resumen de compras.");
        } finally {
            setCargando(false);
        }
    }

    async function confirmarPagoFactura() {
        if (!compraAPagar || pagandoCompra) return;

        try {
            setPagandoCompra(true);
            setErrorPago("");

            await pagarCompra(compraAPagar.id);
            setConfirmacion(`Factura #${compraAPagar.numero_factura} marcada como PAGADA.`);
            setCompraAPagar(null);

            await cargarListadoCompras();
            if (resultado) {
                await consultar();
            }
        } catch (err) {
            setErrorPago(err.message || "No se pudo registrar el pago.");
        } finally {
            setPagandoCompra(false);
        }
    }

    useEffect(() => {
        if (vista !== "proveedores") return;

        let activo = true;

        async function cargar() {
            setCargandoProveedores(true);
            setErrorProveedores("");

            try {
                const datos = await getProveedores();

                if (!Array.isArray(datos)) {
                    throw new Error("No se recibió un listado válido de proveedores.");
                }

                if (activo) setProveedores(datos);
            } catch (err) {
                if (activo) {
                    setErrorProveedores(err.message || "No se pudieron cargar los proveedores.");
                }
            } finally {
                if (activo) setCargandoProveedores(false);
            }
        }

        cargar();

        return () => {
            activo = false;
        };
    }, [vista]);

    async function cargarProveedores() {
        setCargandoProveedores(true);
        setErrorProveedores("");

        try {
            const datos = await getProveedores();

            if (!Array.isArray(datos)) {
                throw new Error("No se recibió un listado válido de proveedores.");
            }

            setProveedores(datos);
        } catch (err) {
            setErrorProveedores(err.message || "No se pudieron cargar los proveedores.");
        } finally {
            setCargandoProveedores(false);
        }
    }

    function abrirProveedor(proveedor = null) {
        setProveedorEditando(proveedor);
        setNombreProveedor(proveedor?.nombre || "");
        setNitProveedor(formatearNit(proveedor?.nit || ""));
        setErrorProveedor("");
        setModalProveedor(true);
    }

    function cerrarModalProveedor() {
        if (guardandoProveedor) return;

        setModalProveedor(false);
        setProveedorEditando(null);
        setErrorProveedor("");
    }

    async function guardarProveedor(evento) {
        evento?.preventDefault();
        if (guardandoProveedor) return;

        const nombre = nombreProveedor.trim();
        const nit = nitProveedor.trim();
        const digitosNit = nit.replace(/\D/g, "");

        if (!nombre || nombre.length > 100) {
            setErrorProveedor("El nombre es obligatorio y admite hasta 100 caracteres.");
            return;
        }

        if (nit && digitosNit.length !== 14) {
            setErrorProveedor("El NIT debe contener exactamente 14 dígitos.");
            return;
        }

        setGuardandoProveedor(true);
        setErrorProveedor("");

        try {
            const datos = { nombre, nit: nit || null };

            if (proveedorEditando) {
                await actualizarProveedor(proveedorEditando.id, datos);
            } else {
                await crearProveedor(datos);
            }

            setModalProveedor(false);
            setProveedorEditando(null);
            await cargarProveedores();
        } catch (err) {
            setErrorProveedor(err.message || "No se pudo guardar el proveedor.");
        } finally {
            setGuardandoProveedor(false);
        }
    }

    function abrirEliminarProveedor(proveedor) {
        setProveedorEliminar(proveedor);
        setErrorEliminar("");
    }

    function cerrarEliminarProveedor() {
        if (eliminandoProveedor !== null) return;

        setProveedorEliminar(null);
        setErrorEliminar("");
    }

    async function borrarProveedor() {
        if (!proveedorEliminar || eliminandoProveedor !== null) return;

        setEliminandoProveedor(proveedorEliminar.id);
        setErrorEliminar("");

        try {
            await eliminarProveedor(proveedorEliminar.id);
            setProveedorEliminar(null);
            await cargarProveedores();
        } catch (err) {
            setErrorEliminar(err.message || "No se pudo eliminar el proveedor.");
        } finally {
            setEliminandoProveedor(null);
        }
    }

    const busqueda = busquedaProveedor.trim().toLowerCase();

    const proveedoresFiltrados = proveedores.filter((proveedor) =>
        (proveedor.nombre || "").toLowerCase().includes(busqueda) ||
        (proveedor.nit || "").toLowerCase().includes(busqueda)
    );

    const comprasFiltradas = compras.filter((c) => {
        if (filtroPago === "TODAS") return true;
        return c.estado_pago === filtroPago;
    });

    return (
        <section className="compras-page" aria-labelledby="compras-titulo">
            <header className="compras-header">
                <div>
                    <h1 id="compras-titulo" className="compras-titulo">Compras</h1>
                    <p className="compras-subtitulo">
                        Registra compras, liquida cuentas por pagar y administra proveedores.
                    </p>
                </div>

                {vista === "compras" ? (
                    !formularioAbierto && (
                        <Button
                            variant="secondary"
                            className={"text-light"}
                            disabled={!sucursalId || cargando}
                            onClick={() => {
                                setConfirmacion("");
                                setFormularioAbierto(true);
                            }}
                        >
                            Nueva compra
                        </Button>
                    )
                ) : (
                    <Button variant="secondary" className="text-white" onClick={() => abrirProveedor()}>
                        Agregar proveedor
                    </Button>
                )}
            </header>

            {!formularioAbierto && (
                <Tabs options={vistas} value={vista} onChange={setVista} />
            )}

            {vista === "compras" ? (
                <div className="compras-contenido">
                    {!sucursalId && (
                        <Alert color="info">
                            Para registrar una compra, selecciona una sucursal en la barra superior o inicia sesión con una cuenta asignada.
                        </Alert>
                    )}

                    {confirmacion && (
                        <Alert color="success" role="status">{confirmacion}</Alert>
                    )}

                    {formularioAbierto ? (
                        <CompraForm
                            usuario={{ ...usuario, sucursal_id: sucursalId }}
                            sucursalId={sucursalId}
                            onCancel={() => setFormularioAbierto(false)}
                            onSaved={(compra) => {
                                setResultado(null);
                                setError("");
                                setConfirmacion(`Factura ${compra.numero_factura} registrada. Quedó pendiente de pago y se actualizó el inventario.`);
                                setFormularioAbierto(false);
                                cargarListadoCompras();
                            }}
                        />
                    ) : (
                        <>
                            {/* 1. BARRA DE FILTRO DE PERÍODO */}
                            <Card className="mb-4">
                                <Form onSubmit={consultar} aria-busy={cargando}>
                                    <fieldset disabled={cargando}>
                                        <Row className="align-items-center g-4">
                                            <Col lg={4}>
                                                <h2 className="small mb-1">Resumen de costos y gastos</h2>
                                                <p className="text-muted small mb-0">
                                                    Filtra los egresos y cuentas pendientes por rango de fechas.
                                                </p>
                                            </Col>

                                            <Col sm={6} md={4} lg={3}>
                                                <FormGroup className="mb-0">
                                                    <Label for="compras-inicio" className="small fw-semibold text-muted mb-1">
                                                        Fecha inicial
                                                    </Label>
                                                    <Input
                                                        type="date"
                                                        id="compras-inicio"
                                                        required
                                                        value={inicio}
                                                        onChange={(e) => setInicio(e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col sm={6} md={4} lg={3}>
                                                <FormGroup className="mb-0">
                                                    <Label for="compras-fin" className="small fw-semibold text-muted mb-1">
                                                        Fecha final
                                                    </Label>
                                                    <Input
                                                        type="date"
                                                        id="compras-fin"
                                                        required
                                                        value={fin}
                                                        onChange={(e) => setFin(e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4} lg={2}>
                                                <Button
                                                    variant="secondary"
                                                    type="submit"
                                                    className="w-100 text-white"
                                                >
                                                    {cargando ? "Consultando…" : "Consultar"}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </fieldset>
                                </Form>
                            </Card>

                            {error && <Alert color="danger" role="alert">{error}</Alert>}
                            {cargando && <p role="status">Cargando resumen de compras…</p>}

                            {/* 2. TARJETAS KPI EN 3 COLUMNAS UNIFORMES */}
                            {resultado && (
                                <section aria-label="Resultados de compras" className="mb-4">
                                    <div className="d-flex flex-wrap justify-content-between align-items-center mb-2">
                                        <span className="text-muted small" role="status">
                                            Período: <strong>{resultado.rango.inicio}</strong> al{" "}
                                            <strong>{resultado.rango.fin}</strong> (El Salvador)
                                        </span>
                                        <span className="badge rounded-pill bg-light text-dark border px-3 py-1">
                                            {conteo.format(resultado.cantidad_transacciones)}{" "}
                                            {resultado.cantidad_transacciones === 1 ? "compra registrada" : "compras registradas"}
                                        </span>
                                    </div>

                                    {resultado.cantidad_transacciones === 0 && (
                                        <Alert color="info" className="mb-3">
                                            No se encontraron compras para este período.
                                        </Alert>
                                    )}

                                    <Row className="g-3">
                                        {/* KPI 1: GASTOS TOTALES */}
                                        <Col md={4}>
                                            <Card className="h-100">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <span className="text-muted small fw-semibold">Gastos totales</span>
                                                    <div className="rounded-3 p-2 bg-light text-dark">
                                                        <Receipt size={18} />
                                                    </div>
                                                </div>
                                                <p className="fs-3 fw-bold mb-1 text-dark">
                                                    {moneda.format(resultado.resumen.gastos_totales)}
                                                </p>
                                                <small className="text-muted">Monto total facturado en el período</small>
                                            </Card>
                                        </Col>

                                        {/* KPI 2: TOTAL PAGADO */}
                                        <Col md={4}>
                                            <Card className="h-100">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <span className="text-muted small fw-semibold">Total pagado</span>
                                                    <div
                                                        className="rounded-3 p-2"
                                                        style={{ backgroundColor: "#e6f4ea", color: "#1e7e34" }}
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </div>
                                                </div>
                                                <p className="fs-3 fw-bold mb-1 text-success">
                                                    {moneda.format(resultado.resumen.total_pagado)}
                                                </p>
                                                <small className="text-muted">Facturas liquidadas a proveedores</small>
                                            </Card>
                                        </Col>

                                        {/* KPI 3: CUENTAS POR PAGAR */}
                                        <Col md={4}>
                                            <Card className="h-100">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <span className="text-muted small fw-semibold">Cuentas por pagar</span>
                                                    <div
                                                        className="rounded-3 p-2"
                                                        style={{ backgroundColor: "#fff3cd", color: "#856404" }}
                                                    >
                                                        <Clock size={18} />
                                                    </div>
                                                </div>
                                                <p className="fs-3 fw-bold mb-1" style={{ color: "#9a6700" }}>
                                                    {moneda.format(resultado.resumen.cuentas_por_pagar)}
                                                </p>
                                                <small className="text-muted">Saldo pendiente de pago</small>
                                            </Card>
                                        </Col>
                                    </Row>
                                </section>
                            )}

                            {/* 3. TABLA DE FACTURAS REGISTRADAS */}
                            <Card>
                                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                    <div>
                                        <h2 className="h5 mb-0">Facturas registradas</h2>
                                        <small className="text-muted">
                                            Gestiona los pagos pendientes de tus proveedores.
                                        </small>
                                    </div>

                                    <div className="d-flex gap-2">
                                        {["TODAS", "PENDIENTE", "PAGADA"].map((estado) => (
                                            <button
                                                key={estado}
                                                type="button"
                                                className={`btn btn-sm rounded-pill px-3 ${
                                                    filtroPago === estado ? "btn-dark" : "btn-outline-secondary"
                                                }`}
                                                onClick={() => setFiltroPago(estado)}
                                            >
                                                {estado === "TODAS"
                                                    ? "Todas"
                                                    : estado === "PENDIENTE"
                                                        ? "Pendientes"
                                                        : "Pagadas"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div
                                    className="compras-tabla-contenedor"
                                    style={{ maxHeight: "420px", overflowY: "auto" }}
                                >
                                    <table className="compras-tabla">
                                        <thead style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#fff" }}>
                                        <tr>
                                            <th>Factura</th>
                                            <th>Proveedor</th>
                                            <th>Vencimiento</th>
                                            <th>Total</th>
                                            <th>Estado</th>
                                            <th>Acción</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {cargandoCompras ? (
                                            <tr>
                                                <td colSpan={6} className="compras-mensaje">
                                                    Cargando facturas...
                                                </td>
                                            </tr>
                                        ) : comprasFiltradas.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="compras-mensaje">
                                                    No hay facturas registradas en esta vista.
                                                </td>
                                            </tr>
                                        ) : (
                                            comprasFiltradas.map((compra) => (
                                                <tr key={compra.id}>
                                                    <td className="compras-nombre">#{compra.numero_factura}</td>
                                                    <td>{compra.proveedores?.nombre || "Proveedor"}</td>
                                                    <td>{formatearFecha(compra.fecha_vencimiento)}</td>
                                                    <td className="fw-semibold">{moneda.format(compra.total)}</td>
                                                    <td>
                                                        <StatusBadge
                                                            text={compra.estado_pago === "PAGADA" ? "Pagada" : "Pendiente"}
                                                            variant={compra.estado_pago === "PAGADA" ? "success" : "warning"}
                                                        />
                                                    </td>
                                                    <td>
                                                        {compra.estado_pago === "PENDIENTE" ? (
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                                                                onClick={() => {
                                                                    setErrorPago("");
                                                                    setCompraAPagar(compra);
                                                                }}
                                                            >
                                                                <CheckCircle2 size={15} />
                                                                Pagar factura
                                                            </button>
                                                        ) : (
                                                            <small className="text-muted">
                                                                Pagada {formatearFecha(compra.fecha_pago)}
                                                            </small>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            ) : (
                <section className="compras-contenido" aria-label="Gestión de proveedores">
                    {errorProveedores && (
                        <Alert color="danger" role="alert">
                            {errorProveedores}
                        </Alert>
                    )}

                    <div className="compras-filtros">
                        <Row>
                            <Col md={8}>
                                <Input
                                    type="search"
                                    placeholder="Buscar proveedor por nombre o NIT..."
                                    aria-label="Buscar proveedores"
                                    value={busquedaProveedor}
                                    onChange={(e) => setBusquedaProveedor(e.target.value)}
                                />
                            </Col>
                        </Row>
                    </div>

                    {cargandoProveedores && (
                        <p role="status">Cargando proveedores…</p>
                    )}

                    <div className="compras-tabla-contenedor">
                        <table className="compras-tabla">
                            <thead>
                            <tr>
                                <th>Proveedor</th>
                                <th>NIT</th>
                                <th>Acción</th>
                            </tr>
                            </thead>

                            <tbody>
                            {!cargandoProveedores && proveedoresFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="compras-mensaje">
                                        {errorProveedores
                                            ? "No se pudo cargar el listado de proveedores."
                                            : busqueda
                                                ? "No se encontraron proveedores con esa búsqueda."
                                                : "No hay proveedores registrados."}
                                    </td>
                                </tr>
                            ) : (
                                proveedoresFiltrados.map((proveedor) => (
                                    <tr key={proveedor.id}>
                                        <td className="compras-nombre">
                                            {proveedor.nombre}
                                        </td>

                                        <td>{proveedor.nit || "—"}</td>

                                        <td>
                                            <div className="compras-acciones">
                                                <button
                                                    type="button"
                                                    className="compras-icono compras-icono--editar"
                                                    title="Editar proveedor"
                                                    aria-label={`Editar ${proveedor.nombre}`}
                                                    disabled={eliminandoProveedor !== null}
                                                    onClick={() => abrirProveedor(proveedor)}
                                                >
                                                    <Pencil />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="compras-icono compras-icono--eliminar"
                                                    title="Eliminar proveedor"
                                                    aria-label={`Eliminar ${proveedor.nombre}`}
                                                    disabled={eliminandoProveedor !== null}
                                                    onClick={() => abrirEliminarProveedor(proveedor)}
                                                >
                                                    <Ban />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* MODAL CONFIRMAR PAGO DE FACTURA */}
            <Modal
                show={compraAPagar !== null}
                title="Confirmar pago de factura"
                onClose={pagandoCompra ? undefined : () => setCompraAPagar(null)}
                footer={
                    <>
                        <Button
                            text="Cancelar"
                            variant="outline-secondary"
                            disabled={pagandoCompra}
                            onClick={() => setCompraAPagar(null)}
                        />
                        <Button
                            text={pagandoCompra ? "Registrando pago..." : "Confirmar pago"}
                            variant="secondary"
                            disabled={pagandoCompra}
                            onClick={confirmarPagoFactura}
                        />
                    </>
                }
            >
                <p>
                    ¿Confirmas que deseas marcar como <strong>PAGADA</strong> la factura{" "}
                    <strong>#{compraAPagar?.numero_factura}</strong> de{" "}
                    <strong>{compraAPagar?.proveedores?.nombre}</strong> por un monto de{" "}
                    <strong>{moneda.format(compraAPagar?.total || 0)}</strong>?
                </p>
                {errorPago && (
                    <Alert color="danger" className="mb-0" role="alert">
                        {errorPago}
                    </Alert>
                )}
            </Modal>

            {/* MODALES DE PROVEEDORES */}
            <Modal
                show={modalProveedor}
                title={proveedorEditando ? "Editar proveedor" : "Agregar proveedor"}
                onClose={guardandoProveedor ? undefined : cerrarModalProveedor}
                footer={
                    <>
                        <Button text="Cancelar" variant="outline-secondary" disabled={guardandoProveedor} onClick={cerrarModalProveedor} />
                        <Button
                            text={
                                guardandoProveedor
                                    ? "Guardando…"
                                    : proveedorEditando
                                        ? "Guardar cambios"
                                        : "Agregar proveedor"
                            }
                            variant="secondary"
                            disabled={
                                guardandoProveedor ||
                                !nombreProveedor.trim() ||
                                (nitProveedor.length > 0 &&
                                    nitProveedor.replace(/\D/g, "").length !== 14)
                            }
                            className="text-white"
                            onClick={guardarProveedor}
                        />
                    </>
                }
            >
                <Form onSubmit={guardarProveedor}>
                    <FormGroup>
                        <Label for="proveedor-nombre">Nombre del proveedor *</Label>
                        <Input
                            id="proveedor-nombre"
                            type="text"
                            placeholder="Ej. Distribuidora Central"
                            value={nombreProveedor}
                            maxLength={100}
                            required
                            disabled={guardandoProveedor}
                            onChange={(e) => setNombreProveedor(e.target.value)}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label for="proveedor-nit">NIT</Label>
                        <Input
                            id="proveedor-nit"
                            type="text"
                            inputMode="numeric"
                            placeholder="0000-000000-000-0"
                            value={nitProveedor}
                            maxLength={17}
                            disabled={guardandoProveedor}
                            onChange={(e) => setNitProveedor(formatearNit(e.target.value))}
                        />
                    </FormGroup>

                    {errorProveedor && (
                        <Alert color="danger" role="alert">{errorProveedor}</Alert>
                    )}
                </Form>
            </Modal>

            <Modal
                show={proveedorEliminar !== null}
                title="Eliminar proveedor"
                onClose={eliminandoProveedor !== null ? undefined : cerrarEliminarProveedor}
                footer={
                    <>
                        <Button text="Cancelar" variant="outline-secondary" disabled={eliminandoProveedor !== null} onClick={cerrarEliminarProveedor} />
                        <Button text={eliminandoProveedor !== null ? "Eliminando..." : "Eliminar"} variant="danger" disabled={eliminandoProveedor !== null} onClick={borrarProveedor} />
                    </>
                }
            >
                <p className="mb-3">
                    ¿Estás seguro de que deseas eliminar al proveedor{" "}
                    <strong>{proveedorEliminar?.nombre}</strong>?
                </p>

                <Alert color="warning" className="mb-0">
                    El proveedor se eliminará permanentemente de la base de datos.
                    Si tiene compras asociadas, no podrá eliminarse.
                </Alert>

                {errorEliminar && (
                    <Alert color="danger" className="mt-3 mb-0" role="alert">
                        {errorEliminar}
                    </Alert>
                )}
            </Modal>
        </section>
    );
}