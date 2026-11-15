import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
// Servicios
import { simularPlanilla, generarPlanilla, obtenerPlanilla } from "../services/planilla.js";
import { getSucursales } from "../services/sucursales.js";
// Utilidad de reportes PDF
import {
    generarReportePlanillaPDF,
    generarBoletaEmpleadoPDF,
} from "../utils/generarReportePlanillaPDF.js";
// Componentes reutilizables UI
import Button from "../components/Common/Button.jsx";
import StatusBadge from "../components/Common/StatusBadge.jsx";
import Modal from "../components/Common/Modal.jsx";
// Iconos
import { BarChart3, AlertTriangle, CheckCircle2, Eye } from "lucide-react";

const MESES = [
    { valor: 1, nombre: "Enero" },
    { valor: 2, nombre: "Febrero" },
    { valor: 3, nombre: "Marzo" },
    { valor: 4, nombre: "Abril" },
    { valor: 5, nombre: "Mayo" },
    { valor: 6, nombre: "Junio" },
    { valor: 7, nombre: "Julio" },
    { valor: 8, nombre: "Agosto" },
    { valor: 9, nombre: "Septiembre" },
    { valor: 10, nombre: "Octubre" },
    { valor: 11, nombre: "Noviembre" },
    { valor: 12, nombre: "Diciembre" },
];

const ANIO_INICIO_SISTEMA = 2026;

export default function PlanillaPage() {
    const { usuario } = useAuth();
    const { sucursalSeleccionada } = useOutletContext() || {};

    const esAdminGlobal = usuario?.rol === "ADMIN" && usuario?.sucursal_id == null;
    const puedeGenerar = usuario?.rol === "ADMIN";

    // Sucursales (para Admin Global cuando aún no ha seleccionado una en el Navbar)
    const [sucursales, setSucursales] = useState([]);

    const sucursalActivaId = esAdminGlobal
        ? (sucursalSeleccionada?.id ?? sucursales[0]?.id ?? null)
        : (usuario?.sucursal_id ?? null);

    const sucursalActivaNombre =
        sucursalSeleccionada?.nombre ||
        sucursales.find((s) => s.id === sucursalActivaId)?.nombre ||
        "Sucursal asignada";

    // Fecha actual y rangos válidos (desde 2026 hasta el mes/año actual)
    const hoy = new Date();
    const anioActual = hoy.getFullYear();
    const mesActual = hoy.getMonth() + 1;

    const [anio, setAnio] = useState(Math.max(ANIO_INICIO_SISTEMA, anioActual));
    const [mes, setMes] = useState(mesActual);
    const [quincena, setQuincena] = useState(hoy.getDate() <= 15 ? 1 : 2);

    // Estados de la planilla
    const [filasPlanilla, setFilasPlanilla] = useState([]);
    const [yaGenerada, setYaGenerada] = useState(false);
    const [calculado, setCalculado] = useState(false);

    // Estados de carga, mensajes y modales
    const [cargando, setCargando] = useState(false);
    const [generando, setGenerando] = useState(false);
    const [error, setError] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");
    const [modalConfirmar, setModalConfirmar] = useState(false);

    // Estado del previsualizador de PDF
    const [previewPdf, setPreviewPdf] = useState(null);

    // Cargar sucursales si es Admin Global
    useEffect(() => {
        if (!esAdminGlobal) return;
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
    }, [esAdminGlobal]);

    // Reiniciar vista cuando cambie la sucursal o algún filtro del período
    useEffect(() => {
        setCalculado(false);
        setFilasPlanilla([]);
        setYaGenerada(false);
        setError("");
        setMensajeExito("");
    }, [sucursalActivaId, anio, mes, quincena]);

    // Liberar memoria del Blob URL al cerrar el previsualizador
    function cerrarPrevisualizador() {
        if (previewPdf?.blobUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(previewPdf.blobUrl);
        }
        setPreviewPdf(null);
    }

    const nombreMes = MESES.find((m) => m.valor === Number(mes))?.nombre || "";

    function abrirVistaPreviaReporte() {
        try {
            const docPreview = generarReportePlanillaPDF({
                filas: filasPlanilla,
                sucursalNombre: sucursalActivaNombre,
                mesNombre: nombreMes,
                anio,
                quincena,
                estado: yaGenerada ? "GENERADA" : "VISTA PREVIA",
                generadoPor: usuario?.nombre || "Administrador",
            });
            setPreviewPdf(docPreview);
        } catch (err) {
            setError(err.message || "No se pudo generar la vista previa del reporte.");
        }
    }

    function abrirVistaPreviaBoleta(empleadoItem) {
        try {
            const docPreview = generarBoletaEmpleadoPDF({
                empleado: empleadoItem,
                sucursalNombre: sucursalActivaNombre,
                mesNombre: nombreMes,
                anio,
                quincena,
            });
            setPreviewPdf(docPreview);
        } catch (err) {
            setError(err.message || "No se pudo generar la vista previa de la boleta.");
        }
    }

    // Normaliza la respuesta del backend
    function extraerFilas(respuesta) {
        if (Array.isArray(respuesta)) return respuesta;
        if (Array.isArray(respuesta?.pagos)) return respuesta.pagos;
        if (Array.isArray(respuesta?.planilla)) return respuesta.planilla;
        if (Array.isArray(respuesta?.detalle)) return respuesta.detalle;
        if (Array.isArray(respuesta?.empleados)) return respuesta.empleados;
        return [];
    }

    // ==========================================
    // CONSULTAR O CALCULAR PLANILLA DEL PERÍODO
    // ==========================================
    async function handleCalcular() {
        if (!sucursalActivaId) {
            setError("Selecciona una sucursal antes de calcular la planilla.");
            return;
        }

        try {
            setCargando(true);
            setError("");
            setMensajeExito("");

            // 1. Verificar si la planilla de ese período ya existe emitida en BD
            try {
                const existente = await obtenerPlanilla({
                    anio,
                    mes,
                    quincena,
                    sucursalId: sucursalActivaId,
                });
                const listaExistente = extraerFilas(existente);
                if (listaExistente.length > 0) {
                    setFilasPlanilla(listaExistente);
                    setYaGenerada(true);
                    setCalculado(true);
                    return;
                }
            } catch (errConsulta) {
                if (errConsulta?.status && errConsulta.status !== 404) {
                    throw errConsulta;
                }
            }

            // 2. Si aún no existe, previsualizar el cálculo mediante POST /api/nomina/simular
            const simulacion = await simularPlanilla({
                anio,
                mes,
                quincena,
                sucursalId: sucursalActivaId,
            });

            const listaSimulada = extraerFilas(simulacion);
            setFilasPlanilla(listaSimulada);
            setYaGenerada(false);
            setCalculado(true);
        } catch (err) {
            setError(err.message || "Error al calcular la planilla del período.");
        } finally {
            setCargando(false);
        }
    }

    // ==========================================
    // CONFIRMAR Y GENERAR PLANILLA (POST /generar)
    // ==========================================
    async function handleConfirmarGeneracion() {
        try {
            setGenerando(true);
            setError("");

            const respuesta = await generarPlanilla({
                anio,
                mes,
                quincena,
                sucursalId: sucursalActivaId,
            });

            const listaGuardada = extraerFilas(respuesta);
            if (listaGuardada.length > 0) {
                setFilasPlanilla(listaGuardada);
            }

            setYaGenerada(true);
            setModalConfirmar(false);
            setMensajeExito("Planilla confirmada y registrada exitosamente en el sistema.");
        } catch (err) {
            setModalConfirmar(false);
            setError(err.message || "No se pudo generar la planilla.");
        } finally {
            setGenerando(false);
        }
    }

    // Totales acumulados
    const totalSalarioBruto = filasPlanilla.reduce(
        (acc, curr) => acc + Number(curr.salario_bruto ?? curr.salarioBruto ?? 0),
        0
    );
    const totalIsss = filasPlanilla.reduce((acc, curr) => acc + Number(curr.isss ?? 0), 0);
    const totalAfp = filasPlanilla.reduce((acc, curr) => acc + Number(curr.afp ?? 0), 0);
    const totalRenta = filasPlanilla.reduce((acc, curr) => acc + Number(curr.renta ?? 0), 0);
    const totalNeto = filasPlanilla.reduce(
        (acc, curr) => acc + Number(curr.salario_neto ?? curr.salarioNeto ?? 0),
        0
    );

    const estiloTotal = {
        position: "sticky",
        bottom: 0,
        zIndex: 1,
        backgroundColor: "#faf6f3",
    };

    // Validación de años (solo >= 2026 hasta año actual) y meses (sin meses futuros)
    const aniosDisponibles = Array.from(
        { length: Math.max(1, anioActual - ANIO_INICIO_SISTEMA + 1) },
        (_, idx) => ANIO_INICIO_SISTEMA + idx
    );

    const mesesDisponibles =
        Number(anio) === anioActual
            ? MESES.filter((m) => m.valor <= mesActual)
            : MESES;

    return (
        <div className="inventario-page" style={{ minWidth: 0, flex: "1 1 0%", maxWidth: "100%" }}>
            {/* ENCABEZADO DE LA PÁGINA */}
            <header className="inventario-header">
                <div>
                    <span className="section-tag">Recursos humanos</span>
                    <h1 className="inventario-titulo">Planilla quincenal</h1>
                    <p className="inventario-subtitulo">
                        Previsualiza deducciones y netos antes de confirmar el período, o consulta planillas ya emitidas.
                    </p>
                </div>

                {calculado && (
                    <StatusBadge
                        text={yaGenerada ? "Planilla generada" : "Vista previa (Sin guardar)"}
                        variant={yaGenerada ? "success" : "warning"}
                    />
                )}
            </header>

            {/* ALERTAS DE ERROR O ÉXITO */}
            {error && (
                <div className="alert alert-danger mb-4" role="alert">
                    {error}
                </div>
            )}

            {mensajeExito && (
                <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="alert">
                    <CheckCircle2 size={18} />
                    <span>{mensajeExito}</span>
                </div>
            )}

            {/* TARJETA DE FILTROS DE PERÍODO Y BOTÓN DE CÁLCULO */}
            <div className="periodo-card mb-4">
                <div className="d-flex flex-column flex-md-row gap-3 align-items-md-end">
                    <div style={{ flex: "1 1 160px" }}>
                        <label className="form-label fw-bold small text-muted mb-1">Mes</label>
                        <select
                            className="form-select select-periodo mb-0"
                            value={mes}
                            onChange={(e) => setMes(Number(e.target.value))}
                        >
                            {mesesDisponibles.map((m) => (
                                <option key={m.valor} value={m.valor}>
                                    {m.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ flex: "0 1 110px" }}>
                        <label className="form-label fw-bold small text-muted mb-1">Año</label>
                        <select
                            className="form-select select-periodo mb-0"
                            value={anio}
                            onChange={(e) => {
                                const nuevoAnio = Number(e.target.value);
                                setAnio(nuevoAnio);
                                if (nuevoAnio === anioActual && mes > mesActual) {
                                    setMes(mesActual);
                                }
                            }}
                        >
                            {aniosDisponibles.map((a) => (
                                <option key={a} value={a}>
                                    {a}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ flex: "2 1 240px" }}>
                        <label className="form-label fw-bold small text-muted mb-1">Período</label>
                        <select
                            className="form-select select-periodo mb-0"
                            value={quincena}
                            onChange={(e) => setQuincena(Number(e.target.value))}
                        >
                            <option value={1}>Primera quincena (1 - 15)</option>
                            <option value={2}>Segunda quincena (16 - 30/31)</option>
                        </select>
                    </div>

                    <div style={{ flex: "0 0 auto" }}>
                        <Button
                            text={cargando ? "Consultando..." : "Consultar / Calcular"}
                            variant="secondary"
                            className="w-100 text-white px-4"
                            disabled={cargando || !sucursalActivaId}
                            onClick={handleCalcular}
                        />
                    </div>
                </div>
            </div>

            {/* CONTENIDO DINÁMICO (ESTADO INICIAL VACÍO VS TABLA DE RESULTADOS) */}
            {!calculado ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">
                        <BarChart3 size={24} />
                    </div>
                    <h3 className="h5 fw-bold mb-1" style={{ color: "#261c14" }}>
                        Selecciona el período
                    </h3>
                    <p className="text-muted small mb-0">
                        Presiona <strong>Consultar / Calcular</strong> para cargar o previsualizar la nómina de{" "}
                        {nombreMes} {anio} ({quincena === 1 ? "1.ª" : "2.ª"} quincena).
                    </p>
                </div>
            ) : filasPlanilla.length === 0 ? (
                <div className="empty-state-card">
                    <div className="empty-state-icon">
                        <BarChart3 size={24} />
                    </div>
                    <h3 className="h5 fw-bold mb-1" style={{ color: "#261c14" }}>
                        Sin empleados activos
                    </h3>
                    <p className="text-muted small mb-0">
                        No hay empleados activos asignados a esta sucursal para procesar planilla.
                    </p>
                </div>
            ) : (
                <>
                    {/* TABLA CON DEDUCCIONES CALCULADAS */}
                    <div
                        className="inventario-tabla-contenedor mb-4"
                        style={{ maxHeight: "608px", overflowY: "auto" }}
                    >
                        <table className="inventario-tabla">
                            <thead style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#fff" }}>
                            <tr>
                                <th>EMPLEADO</th>
                                <th>SALARIO BRUTO (1/2)</th>
                                <th>ISSS 3%</th>
                                <th>AFP 7.25%</th>
                                <th>RENTA</th>
                                <th>NETO</th>
                                <th className="text-center">BOLETA</th>
                            </tr>
                            </thead>

                            <tbody>
                            {filasPlanilla.map((item, idx) => {
                                const nombre = item.nombre ?? item.usuarios?.nombre ?? "Empleado";
                                const cargo = item.cargo ?? item.usuarios?.cargo ?? "";
                                const bruto = Number(item.salario_bruto ?? item.salarioBruto ?? 0);
                                const isss = Number(item.isss ?? 0);
                                const afp = Number(item.afp ?? 0);
                                const renta = Number(item.renta ?? 0);
                                const neto = Number(item.salario_neto ?? item.salarioNeto ?? 0);

                                return (
                                    <tr key={item.id ?? item.usuario_id ?? idx}>
                                        <td>
                                            <div className="inventario-nombre" style={{ color: "#261c14" }}>
                                                {nombre}
                                            </div>
                                            {cargo && (
                                                <span className="text-muted small" style={{ fontSize: "11px" }}>
                                                        {cargo}
                                                    </span>
                                            )}
                                        </td>
                                        <td className="inventario-nombre">${bruto.toFixed(2)}</td>
                                        <td className="text-danger">-${isss.toFixed(2)}</td>
                                        <td className="text-danger">-${afp.toFixed(2)}</td>
                                        <td className="text-danger">-${renta.toFixed(2)}</td>
                                        <td className="inventario-nombre text-success fw-bold">
                                            ${neto.toFixed(2)}
                                        </td>
                                        <td className="text-center">
                                            <button
                                                type="button"
                                                className="inventario-icono inventario-icono--editar"
                                                title={`Previsualizar boleta PDF de ${nombre}`}
                                                aria-label={`Previsualizar boleta PDF de ${nombre}`}
                                                onClick={() => abrirVistaPreviaBoleta(item)}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>

                            <tfoot>
                            <tr style={{ fontWeight: "bold" }}>
                                <td className="inventario-nombre" style={estiloTotal}>Total planilla</td>
                                <td className="inventario-nombre" style={estiloTotal}>${totalSalarioBruto.toFixed(2)}</td>
                                <td className="text-danger" style={estiloTotal}>-${totalIsss.toFixed(2)}</td>
                                <td className="text-danger" style={estiloTotal}>-${totalAfp.toFixed(2)}</td>
                                <td className="text-danger" style={estiloTotal}>-${totalRenta.toFixed(2)}</td>
                                <td
                                    className="inventario-nombre text-success"
                                    style={{ ...estiloTotal, fontSize: "15px" }}
                                >
                                    ${totalNeto.toFixed(2)}
                                </td>
                                <td style={estiloTotal}></td>
                            </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* BANNER DE ADVERTENCIA LEGAL */}
                    <div className="legal-alert mb-4">
                        <AlertTriangle size={20} />
                        <div>
                            <strong>Revisión requerida.</strong> El cálculo aplica ISSS del 3% (tope
                            cotizable mensual de $1,000), AFP del 7.25% y la tabla quincenal vigente del
                            Ministerio de Hacienda.
                        </div>
                    </div>

                    {/* ACCIONES FINALES: PREVISUALIZAR REPORTE PDF + CONFIRMAR PLANILLA */}
                    <div className="d-flex flex-wrap justify-content-end gap-2">
                        <Button
                            text="Previsualizar reporte PDF"
                            variant="outline-secondary"
                            className="px-4"
                            onClick={abrirVistaPreviaReporte}
                        />

                        {!yaGenerada && puedeGenerar && (
                            <Button
                                text="Confirmar y generar planilla"
                                variant="secondary"
                                className="text-white px-4"
                                onClick={() => setModalConfirmar(true)}
                            />
                        )}
                    </div>
                </>
            )}

            {/* MODAL 1: CONFIRMACIÓN PARA GUARDAR LA PLANILLA */}
            <Modal
                show={modalConfirmar}
                title="Confirmar generación de planilla"
                onClose={() => {
                    if (!generando) setModalConfirmar(false);
                }}
                footer={
                    <>
                        <Button
                            text="Cancelar"
                            variant="outline-secondary"
                            disabled={generando}
                            onClick={() => setModalConfirmar(false)}
                        />
                        <Button
                            text={generando ? "Procesando..." : "Confirmar y guardar"}
                            variant="secondary"
                            disabled={generando}
                            onClick={handleConfirmarGeneracion}
                        />
                    </>
                }
            >
                <p>
                    ¿Deseas confirmar y registrar la planilla correspondiente a la{" "}
                    <strong>{quincena === 1 ? "primera quincena" : "segunda quincena"}</strong> de{" "}
                    <strong>{nombreMes} {anio}</strong>?
                </p>
                <div className="alert alert-warning mb-0">
                    Total líquido a pagar: <strong>${totalNeto.toFixed(2)}</strong> ({filasPlanilla.length}{" "}
                    empleados). Una vez generada, este período quedará cerrado y no podrá volver a
                    emitirse.
                </div>
            </Modal>

            {/* MODAL 2: PREVISUALIZADOR DE DOCUMENTO PDF ANTES DE DESCARGAR */}
            <Modal
                show={Boolean(previewPdf)}
                title={previewPdf?.titulo || "Vista previa del documento"}
                size="lg"
                onClose={cerrarPrevisualizador}
                footer={
                    <>
                        <Button
                            text="Cerrar"
                            variant="outline-secondary"
                            onClick={cerrarPrevisualizador}
                        />
                        <Button
                            text="Descargar PDF"
                            variant="secondary"
                            className="text-white"
                            onClick={() => previewPdf?.descargar()}
                        />
                    </>
                }
            >
                {previewPdf?.blobUrl && (
                    <div
                        style={{
                            width: "100%",
                            height: "65vh",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: "1px solid #e8d5c2",
                            backgroundColor: "#525659",
                        }}
                    >
                        <iframe
                            src={`${previewPdf.blobUrl}#toolbar=0&navpanes=0`}
                            title={previewPdf.titulo}
                            width="100%"
                            height="100%"
                            style={{ border: "none", display: "block" }}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
}