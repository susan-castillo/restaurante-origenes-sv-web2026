import { useEffect, useState } from 'react';
import { Alert, Col, Row } from 'reactstrap';
import { FaArrowDown, FaArrowUp, FaChartLine, FaCoins, FaLayerGroup, FaShoppingCart, FaStore } from 'react-icons/fa';
import Button from '../components/Common/Button.jsx';
import Card from '../components/Common/Card.jsx';
import StatusBadge from '../components/Common/StatusBadge.jsx';
import KpiCard from '../components/dashboard/KpiCard.jsx';
import { getEstadisticasDashboard } from '../services/dashboardService.js';
import { calcularMargen, formatearDolares, formatearMargen } from '../utils/dashboardFormato.js';
import '../styles/dashboard.scss';

// Esqueleto que se ve mientras llegan los datos (clases "placeholder" de Bootstrap 5).
function KpisCargando() {
    return (
        <Row className="g-3" aria-busy="true" role="status">
            {[1, 2, 3, 4].map((n) => (
                <Col key={n} xs="12" md="6" lg="3">
                    <Card className="kpi-card">
                        <p className="placeholder-glow mb-2"><span className="placeholder col-5" /></p>
                        <p className="placeholder-glow mb-2"><span className="placeholder col-8 placeholder-lg" /></p>
                        <p className="placeholder-glow mb-0"><span className="placeholder col-6" /></p>
                    </Card>
                </Col>
            ))}
        </Row>
    );
}

export default function DashboardPage() {
    // Estado: lo que la pantalla necesita recordar entre renders.
    const [datos, setDatos] = useState(null);       // respuesta del backend
    const [error, setError] = useState(null);       // ApiError si algo falló
    const [cargando, setCargando] = useState(true);
    const [intento, setIntento] = useState(0);      // cambiar este número vuelve a ejecutar el efecto

    useEffect(() => {
        let vigente = true; // evita actualizar el estado si el componente ya se desmontó

        async function cargar() {
            try {
                const respuesta = await getEstadisticasDashboard();
                if (vigente) setDatos(respuesta);
            } catch (err) {
                if (vigente) setError(err);
            } finally {
                if (vigente) setCargando(false);
            }
        }

        cargar();
        return () => { vigente = false; };
    }, [intento]);

    const reintentar = () => {
        setError(null);
        setCargando(true);
        setIntento((anterior) => anterior + 1);
    };

    // ---- Cálculos a partir de la respuesta (los números pueden llegar como texto: Number()) ----
    const tarjetas = datos?.tarjetas_superiores;
    const sucursales = datos?.grafico_rendimiento ?? [];
    const ingresos = Number(tarjetas?.ingresos_totales ?? 0);
    const gastos = Number(tarjetas?.gastos_totales ?? 0);
    const ganancia = Number(tarjetas?.ganancia_neta ?? 0);
    const margen = calcularMargen(ganancia, ingresos);
    const gananciaPositiva = ganancia >= 0;

    // Cada KPI es un objeto; luego se dibujan con map().
    const kpis = [
        { clave: 'sucursales', icono: FaStore, tono: 'cielo', etiqueta: 'Sucursales activas',
          valor: Number(tarjetas?.sucursales_activas ?? 0), auxiliar: 'En operación' },
        { clave: 'ingresos', icono: FaCoins, tono: 'rosa', etiqueta: 'Ingresos totales',
          valor: formatearDolares(ingresos), auxiliar: 'Ventas con IVA incluido' },
        { clave: 'gastos', icono: FaShoppingCart, tono: 'naranja', etiqueta: 'Gastos totales',
          valor: formatearDolares(gastos), auxiliar: 'Compras a proveedores' },
        { clave: 'ganancia', icono: FaChartLine, tono: 'verde', etiqueta: 'Ganancia neta',
          valor: formatearDolares(ganancia),
          valorClase: gananciaPositiva ? 'kpi-card__valor--positivo' : 'kpi-card__valor--negativo',
          extra: (
              <StatusBadge
                  variant={gananciaPositiva ? 'success' : 'danger'}
                  text={<>{gananciaPositiva ? <FaArrowUp className="me-1" /> : <FaArrowDown className="me-1" />}
                      {formatearMargen(margen)} de margen</>}
              />
          ) },
    ];

    // ---- Qué se muestra debajo del encabezado, según el estado ----
    const renderContenido = () => {
        if (cargando) return <KpisCargando />;

        if (error?.status === 403) {
            return <Alert color="warning" role="alert">Esta sección es solo para Administración central.</Alert>;
        }

        if (error) {
            return (
                <Alert color="danger" role="alert">
                    <p className="mb-2">{error.message || 'No se pudo conectar con el servidor.'}</p>
                    <Button variant="outline-danger" onClick={reintentar}>Reintentar</Button>
                </Alert>
            );
        }

        if (sucursales.length === 0) {
            return (
                <Card>
                    <div className="dashboard-page__vacio" role="status">
                        <FaStore aria-hidden="true" />
                        <h2 className="h5">No hay sucursales activas</h2>
                        <p className="mb-0">Aún no existen sucursales en operación para mostrar información.</p>
                    </div>
                </Card>
            );
        }

        return (
            <>
                <Row className="g-3 mb-4">
                    {kpis.map(({ clave, ...kpi }) => (
                        <Col key={clave} xs="12" md="6" lg="3">
                            <KpiCard {...kpi} />
                        </Col>
                    ))}
                </Row>
                {/* PIEZA 4: aquí van "Rendimiento por sucursal" y "Detalle por sucursal" */}
                {/* PIEZA 5: aquí van la tarjeta extra y el modal de la fila */}
            </>
        );
    };

    return (
        <section className="dashboard-page" aria-labelledby="dashboard-titulo">
            <header className="dashboard-page__encabezado">
                <div>
                    <h1 id="dashboard-titulo" className="font-origenes dashboard-page__titulo">Dashboard</h1>
                    <p className="dashboard-page__subtitulo">Resumen global de la cadena</p>
                </div>
                <span className="dashboard-page__acumulado">
                    <FaLayerGroup aria-hidden="true" /> Acumulado histórico
                </span>
            </header>

            {renderContenido()}
        </section>
    );
}