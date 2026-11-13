
import { useEffect, useState } from "react";
import { Pencil, Ban } from "lucide-react";
import { Alert, Col, Form, FormGroup, Input, Label, Row } from "reactstrap";
import Button from "../components/Common/Button.jsx";
import Card from "../components/Common/Card.jsx";
import Tabs from "../components/Common/Tabs.jsx";
import Modal from "../components/Common/Modal.jsx";
import CompraForm from "../components/compras/CompraForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getResumenCompras, getProveedores } from "../services/comprasService.js";
import { crearProveedor, actualizarProveedor, eliminarProveedor } from "../services/proveedoresService.js";

const moneda = new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD"
});

const conteo = new Intl.NumberFormat("es-SV");

const campos = [
    { clave: "gastos_totales", titulo: "Gastos totales" },
    { clave: "total_pagado", titulo: "Total pagado" },
    { clave: "cuentas_por_pagar", titulo: "Cuentas por pagar" }
];

const vistas = [
    { value: "compras", label: "Compras" },
    { value: "proveedores", label: "Proveedores" }
];

export default function ComprasPage() {
    const { usuario } = useAuth();

    const [vista, setVista] = useState("compras");
    const [formularioAbierto, setFormularioAbierto] = useState(false);
    const [confirmacion, setConfirmacion] = useState("");
    const [fin, setFin] = useState(() => new Date().toISOString().slice(0, 10));
    const [inicio, setInicio] = useState(() => `${fin.slice(0, 7)}-01`);
    const [resultado, setResultado] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    const [proveedores, setProveedores] = useState([]);
    const [cargandoProveedores, setCargandoProveedores] = useState(false);
    const [errorProveedores, setErrorProveedores] = useState("");
    const [confirmacionProveedor, setConfirmacionProveedor] = useState("");
    const [busquedaProveedor, setBusquedaProveedor] = useState("");

    const [modalProveedor, setModalProveedor] = useState(false);
    const [proveedorEditando, setProveedorEditando] = useState(null);
    const [nombreProveedor, setNombreProveedor] = useState("");
    const [nitProveedor, setNitProveedor] = useState("");
    const [errorProveedor, setErrorProveedor] = useState("");
    const [guardandoProveedor, setGuardandoProveedor] = useState(false);
    const [eliminandoProveedor, setEliminandoProveedor] = useState(null);

    async function consultar(evento) {
        evento.preventDefault();
        if (cargando) return;

        setResultado(null);

        if (!inicio || !fin || inicio > fin) {
            setError("Selecciona un rango válido. La fecha final debe ser igual o posterior a la inicial.");
            return;
        }

        setCargando(true);
        setError("");

        try {
            const datos = await getResumenCompras(inicio, fin);

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
        setNitProveedor(proveedor?.nit || "");
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

        if (!nombre || nombre.length > 100) {
            setErrorProveedor("El nombre es obligatorio y admite hasta 100 caracteres.");
            return;
        }

        if (nit.length > 20) {
            setErrorProveedor("El NIT admite hasta 20 caracteres.");
            return;
        }

        setGuardandoProveedor(true);
        setErrorProveedor("");

        try {
            const datos = { nombre, nit: nit || null };

            if (proveedorEditando) {
                await actualizarProveedor(proveedorEditando.id, datos);
                setConfirmacionProveedor("Proveedor actualizado correctamente.");
            } else {
                await crearProveedor(datos);
                setConfirmacionProveedor("Proveedor registrado correctamente.");
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

    async function borrarProveedor(proveedor) {
        if (eliminandoProveedor !== null) return;

        if (!window.confirm(`¿Estás seguro de que deseas eliminar al proveedor "${proveedor.nombre}"?`)) {
            return;
        }

        setEliminandoProveedor(proveedor.id);
        setErrorProveedores("");
        setConfirmacionProveedor("");

        try {
            await eliminarProveedor(proveedor.id);
            setConfirmacionProveedor("Proveedor eliminado correctamente.");
            await cargarProveedores();
        } catch (err) {
            setErrorProveedores(err.message || "No se pudo eliminar el proveedor.");
        } finally {
            setEliminandoProveedor(null);
        }
    }

    const busqueda = busquedaProveedor.trim().toLowerCase();

    const proveedoresFiltrados = proveedores.filter((proveedor) =>
        (proveedor.nombre || "").toLowerCase().includes(busqueda) ||
        (proveedor.nit || "").toLowerCase().includes(busqueda)
    );

    return (
        <section className="compras-page" aria-labelledby="compras-titulo">
            <header className="compras-header">
                <div>
                    <h1 id="compras-titulo" className="compras-titulo">Compras</h1>
                    <p className="compras-subtitulo">
                        Registra compras y administra proveedores.
                    </p>
                </div>

                {vista === "compras" ? (
                    !formularioAbierto && (
                        <Button
                            variant="secondary"
                            disabled={!usuario?.sucursal_id || cargando}
                            onClick={() => {
                                setConfirmacion("");
                                setFormularioAbierto(true);
                            }}
                        >
                            Nueva compra
                        </Button>
                    )
                ) : (
                    <Button variant="secondary" onClick={() => abrirProveedor()}>
                        Agregar proveedor
                    </Button>
                )}
            </header>

            {!formularioAbierto && (
                <Tabs options={vistas} value={vista} onChange={setVista} />
            )}

            {vista === "compras" ? (
                <div className="compras-contenido">
                    {!usuario?.sucursal_id && (
                        <Alert color="info">
                            Para registrar una compra, inicia sesión con una cuenta que tenga una sucursal asignada.
                        </Alert>
                    )}

                    {confirmacion && (
                        <Alert color="success" role="status">{confirmacion}</Alert>
                    )}

                    {formularioAbierto ? (
                        <CompraForm
                            usuario={usuario}
                            onCancel={() => setFormularioAbierto(false)}
                            onSaved={(compra) => {
                                setResultado(null);
                                setError("");
                                setConfirmacion(`Factura ${compra.numero_factura} registrada. Quedó pendiente de pago y se actualizó el inventario.`);
                                setFormularioAbierto(false);
                            }}
                        />
                    ) : (
                        <>
                            <Card className="mb-4">
                                <h2 className="h5 mb-3">Resumen de costos y gastos</h2>

                                <Form onSubmit={consultar} aria-busy={cargando}>
                                    <fieldset disabled={cargando}>
                                        <Row className="align-items-end g-3">
                                            <Col md={4}>
                                                <FormGroup className="mb-0">
                                                    <Label for="compras-inicio">Fecha inicial</Label>
                                                    <Input
                                                        type="date"
                                                        id="compras-inicio"
                                                        required
                                                        value={inicio}
                                                        onChange={(e) => setInicio(e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md={4}>
                                                <FormGroup className="mb-0">
                                                    <Label for="compras-fin">Fecha final</Label>
                                                    <Input
                                                        type="date"
                                                        id="compras-fin"
                                                        required
                                                        value={fin}
                                                        onChange={(e) => setFin(e.target.value)}
                                                    />
                                                </FormGroup>
                                            </Col>

                                            <Col md="auto">
                                                <Button variant="secondary" type="submit">
                                                    {cargando ? "Consultando…" : "Consultar resumen"}
                                                </Button>
                                            </Col>
                                        </Row>
                                    </fieldset>
                                </Form>
                            </Card>

                            {error && <Alert color="danger" role="alert">{error}</Alert>}
                            {cargando && <p role="status">Cargando resumen de compras…</p>}

                            {resultado && (
                                <section aria-label="Resultados de compras">
                                    <p className="text-muted" role="status">
                                        {resultado.rango.inicio} al {resultado.rango.fin} (UTC)
                                        {" · "}{conteo.format(resultado.cantidad_transacciones)}
                                        {resultado.cantidad_transacciones === 1 ? " compra" : " compras"}
                                    </p>

                                    {resultado.cantidad_transacciones === 0 && (
                                        <Alert color="info">
                                            No se encontraron compras para este período.
                                        </Alert>
                                    )}

                                    <Row className="g-3">
                                        {campos.map(({ clave, titulo }) => (
                                            <Col md={4} key={clave}>
                                                <Card className="h-100">
                                                    <h3 className="h6 text-muted">{titulo}</h3>
                                                    <p className="fs-4 fw-semibold mb-0">
                                                        {moneda.format(resultado.resumen[clave])}
                                                    </p>
                                                </Card>
                                            </Col>
                                        ))}
                                    </Row>
                                </section>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <section className="compras-contenido" aria-label="Gestión de proveedores">
                    {confirmacionProveedor && (
                        <Alert color="success" role="status">
                            {confirmacionProveedor}
                        </Alert>
                    )}

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
                                                        onClick={() => borrarProveedor(proveedor)}
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

            <Modal
                show={modalProveedor}
                title={proveedorEditando ? "Editar proveedor" : "Agregar proveedor"}
                onClose={guardandoProveedor ? undefined : cerrarModalProveedor}
                footer={
                    <>
                        <Button
                            text="Cancelar"
                            variant="outline-secondary"
                            disabled={guardandoProveedor}
                            onClick={cerrarModalProveedor}
                        />
                        <Button
                            text={guardandoProveedor
                                ? "Guardando…"
                                : proveedorEditando
                                    ? "Guardar cambios"
                                    : "Agregar proveedor"}
                            variant="secondary"
                            disabled={guardandoProveedor || !nombreProveedor.trim()}
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
                            placeholder="Número de identificación tributaria"
                            value={nitProveedor}
                            maxLength={20}
                            disabled={guardandoProveedor}
                            onChange={(e) => setNitProveedor(e.target.value)}
                        />
                    </FormGroup>

                    {errorProveedor && (
                        <Alert color="danger" role="alert">{errorProveedor}</Alert>
                    )}
                </Form>
            </Modal>
        </section>
    );
}
