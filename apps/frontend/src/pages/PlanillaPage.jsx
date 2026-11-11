import { useState } from "react";
// Componentes reutilizables UI
import Button from "../components/Common/Button.jsx";
// Iconos
import { BarChart3, AlertTriangle } from "lucide-react";

// DATOS SIMULADOS DE LA PLANILLA CALCULADA
const planillaCalculadaMock = [
    {
        id: 1,
        nombre: "Ana Martínez",
        cargo: "CAJERO",
        salarioBruto: 350.0,
        isss: 10.5,
        afp: 25.38,
        renta: 16.65,
        salarioNeto: 297.47,
    },
    {
        id: 2,
        nombre: "Carlos Hernández",
        cargo: "BARISTA",
        salarioBruto: 325.0,
        isss: 9.75,
        afp: 23.56,
        renta: 14.41,
        salarioNeto: 277.28,
    },
    {
        id: 3,
        nombre: "Sofía Ramírez",
        cargo: "GERENTE",
        salarioBruto: 725.0,
        isss: 15.0, // Retención ISSS topada a quincena ($30.00 / 2)
        afp: 52.56,
        renta: 71.96,
        salarioNeto: 585.47,
    },
    {
        id: 4,
        nombre: "María López",
        cargo: "RRHH",
        salarioBruto: 600.0,
        isss: 15.0, // Retención ISSS topada
        afp: 43.5,
        renta: 48.78,
        salarioNeto: 492.72,
    },
];

export default function PlanillaPage() {
    // Estados locales para los selectores de período y el cálculo
    const [mesAnio, setMesAnio] = useState("Junio 2025");
    const [periodo, setPeriodo] = useState("Primera quincena");
    const [calculado, setCalculado] = useState(false);

    // Función para simular el cálculo de nómina
    const handleCalcular = () => {
        setCalculado(true);
    };

    // Totales acumulados de la planilla quincenal
    const totalSalarioBruto = planillaCalculadaMock.reduce((acc, curr) => acc + curr.salarioBruto, 0);
    const totalIsss = planillaCalculadaMock.reduce((acc, curr) => acc + curr.isss, 0);
    const totalAfp = planillaCalculadaMock.reduce((acc, curr) => acc + curr.afp, 0);
    const totalRenta = planillaCalculadaMock.reduce((acc, curr) => acc + curr.renta, 0);
    const totalNeto = planillaCalculadaMock.reduce((acc, curr) => acc + curr.salarioNeto, 0);

    // NUEVO: estilo de las celdas de totales, quedan fijas abajo mientras se hace scroll
    const estiloTotal = {
        position: "sticky",
        bottom: 0,
        zIndex: 1,
        backgroundColor: "#faf6f3",
    };

    return (
        <div className="inventario-page" style={{ minWidth: 0, flex: "1 1 0%", maxWidth: "100%" }}>
            {/* ENCABEZADO DE LA PÁGINA */}
            <header className="inventario-header">
                <div>
                    <span className="section-tag">Recursos humanos</span>
                    <h1 className="inventario-titulo">Planilla quincenal</h1>
                    <p className="inventario-subtitulo">
                        Previsualiza deducciones y netos antes de confirmar el período.
                    </p>
                </div>
            </header>

            {/* TARJETA DE FILTROS DE PERÍODO Y BOTÓN DE CÁLCULO */}
            <div className="periodo-card mb-4">
                <div className="row g-3 align-items-end">
                    <div className="col-12 col-md-5 align-items-center">
                        <label className="form-label fw-bold small text-muted mb-1">Mes y año</label>
                        <select
                            className="form-select select-periodo mb-0"
                            value={mesAnio}
                            onChange={(e) => setMesAnio(e.target.value)}
                        >
                            <option value="Junio 2025">Junio 2025</option>
                            <option value="Julio 2025">Julio 2025</option>
                        </select>
                    </div>

                    <div className="col-12 col-md-4 align-items-center gap-2">
                        <label className="form-label fw-bold small text-muted mb-1">Período</label>
                        <select
                            className="form-select select-periodo mb-0"
                            value={periodo}
                            onChange={(e) => setPeriodo(e.target.value)}
                        >
                            <option value="Primera quincena">Primera quincena</option>
                            <option value="Segunda quincena">Segunda quincena</option>
                        </select>
                    </div>

                    <div className="col-12 col-md-3">
                        <Button
                            text="Calcular planilla"
                            variant="secondary"
                            className="w-100 text-white"
                            onClick={handleCalcular}
                        />
                    </div>
                </div>
            </div>

            {/* CONTENIDO DINÁMICO (ESTADO INICIAL VACÍO VS TABLA DE RESULTADOS) */}
            {!calculado ? (
                /* ESTADO INICIAL VACÍO */
                <div className="empty-state-card">
                    <div className="empty-state-icon">
                        <BarChart3 size={24} />
                    </div>
                    <h3 className="h5 fw-bold mb-1" style={{ color: "#261c14" }}>
                        Selecciona el período
                    </h3>
                    <p className="text-muted small mb-0">
                        Calcularemos la planilla de 4 empleados activos.
                    </p>
                </div>
            ) : (
                /* VISTA DE TABLA CON DEDUCCIONES CALCULADAS */
                <>
                    {/* CAMBIO: altura máxima, si hay muchas filas aparece la barra de scroll (igual que en Empleados) */}
                    <div
                        className="inventario-tabla-contenedor mb-4"
                        style={{ maxHeight: "608px", overflowY: "auto" }}
                    >
                        <table className="inventario-tabla">
                            {/* CAMBIO: encabezado fijo, se queda arriba mientras se hace scroll */}
                            <thead style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#fff" }}>
                            <tr>
                                <th>EMPLEADO</th>
                                <th>SALARIO BRUTO</th>
                                <th>ISSS 3%</th>
                                <th>AFP 7.25%</th>
                                <th>RENTA</th>
                                <th>NETO</th>
                            </tr>
                            </thead>

                            <tbody>
                            {planillaCalculadaMock.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <div className="inventario-nombre" style={{ color: "#261c14" }}>
                                            {item.nombre}
                                        </div>
                                        <span className="text-muted small" style={{ fontSize: "11px" }}>
                                            {item.cargo}
                                        </span>
                                    </td>
                                    <td className="inventario-nombre">${item.salarioBruto.toFixed(2)}</td>
                                    <td className="text-danger">-${item.isss.toFixed(2)}</td>
                                    <td className="text-danger">-${item.afp.toFixed(2)}</td>
                                    <td className="text-danger">-${item.renta.toFixed(2)}</td>
                                    <td className="inventario-nombre text-success fw-bold">
                                        ${item.salarioNeto.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            </tbody>

                            {/* CAMBIO: los totales pasaron a <tfoot> y quedan fijos abajo, siempre visibles */}
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
                            </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* ACCIÓN FINAL */}
                    <div className="d-flex justify-content-end">
                        <Button
                            text="Confirmar y generar planilla"
                            variant="secondary"
                            className="text-white px-4 mt-3"
                            onClick={() => alert("¡Planilla guardada y procesada con éxito!")}
                        />
                    </div>
                </>
            )}
        </div>
    );
}