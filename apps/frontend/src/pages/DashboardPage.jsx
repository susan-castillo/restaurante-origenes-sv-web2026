import { useEffect, useState } from 'react';
import { Alert, Col, Row } from 'reactstrap';
import { FaChartLine, FaCoins, FaLayerGroup, FaShoppingCart, FaStore } from 'react-icons/fa';
import Button from '../components/Common/Button.jsx';
import Card from '../components/Common/Card.jsx';
import KpiCard from '../components/dashboard/KpiCard.jsx';
import RendimientoSucursales from '../components/dashboard/RendimientoSucursales.jsx';
import DetalleSucursales from '../components/dashboard/DetalleSucursales.jsx';
import ResumenCadena from '../components/dashboard/ResumenCadena.jsx';
import { getEstadisticasDashboard } from '../services/dashboardService.js';
import { calcularMargen, formatearDolares, formatearMargen } from '../utils/dashboardFormato.js';
import '../styles/dashboard.scss';
import { useAuth } from '../context/AuthContext.jsx';
import SucursalDetalleModal from '../components/dashboard/SucursalDetalleModal.jsx';

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

// Saludo según la hora local del navegador.
const saludoSegunHora = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
};

export default function DashboardPage() {
    // Estado: lo que la pantalla necesita recordar entre renders.
    const [datos, setDatos] = useState(null);       // respuesta del backend
    const [error, setError] = useState(null);       // ApiError si algo falló
    const [cargando, setCargando] = useState(true);
    const [intento, setIntento] = useState(0);      // cambiar este número vuelve a ejecutar el efecto
    const { usuario } = useAuth();
    const primerNombre = usuario?.nombre?.split(' ')[0] ?? '';
    const [seleccionada, setSeleccionada] = useState(null); // fila abierta en el modal

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

    // ---- Cálculos a partir de la respuesta ----
    const tarjetas = datos?.tarjetas_superiores;
    const sucursales = datos?.grafico_rendimiento ?? [];
    const ingresos = Number(tarjetas?.ingresos_totales ?? 0);
    const gastos = Number(tarjetas?.gastos_totales ?? 0);
    const ganancia = Number(tarjetas?.ganancia_neta ?? 0);
    const margen = calcularMargen(ganancia, ingresos);

    // Sumas y máximo sobre el arreglo de sucursales (reduce).
    const empleadosTotal = sucursales.reduce((suma, s) => suma + Number(s.empleados_asignados), 0);
    const ventasHoyTotal = sucursales.reduce((suma, s) => suma + Number(s.ventas_del_dia), 0);
    const mejor = sucursales.reduce(
        (actual, s) => (actual === null || Number(s.rentabilidad) > Number(actual.rentabilidad) ? s : actual),
        null,
    );

    // Cada KPI es un objeto; luego se dibujan con map().
    const kpis = [
        { clave: 'sucursales', icono: FaStore, tono: 'cielo', etiqueta: 'Sucursales activas',
          valor: Number(tarjetas?.sucursales_activas ?? 0), auxiliar: `${empleadosTotal} empleados en total` },
        { clave: 'ingresos', icono: FaCoins, tono: 'rosa', etiqueta: 'Ingresos totales',
          valor: formatearDolares(ingresos), auxiliar: 'Ventas con IVA incluido' },
        { clave: 'gastos', icono: FaShoppingCart, tono: 'naranja', etiqueta: 'Gastos totales',
          valor: formatearDolares(gastos), auxiliar: 'Compras a proveedores' },
        { clave: 'ganancia', icono: FaChartLine, tono: 'verde', etiqueta: 'Ganancia neta',
          valor: formatearDolares(ganancia), auxiliar: `${formatearMargen(margen)} de margen`,
          auxiliarClase: ganancia >= 0 ? 'kpi-card__auxiliar--positivo' : 'kpi-card__auxiliar--negativo' },
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

                <Row className="g-3 mb-4">
                    <Col xs="12" lg="5"><RendimientoSucursales sucursales={sucursales} /></Col>
                      <Col xs="12" lg="7">
                        <DetalleSucursales sucursales={sucursales} onSeleccionar={setSeleccionada} />
                     </Col>
                </Row>

            
                <ResumenCadena ventasHoy={ventasHoyTotal} mejor={mejor} />
                <SucursalDetalleModal sucursal={seleccionada} onCerrar={() => setSeleccionada(null)} />
            </>
        );
    };

    return (
        <section className="dashboard-page" aria-labelledby="dashboard-titulo">
           <header className="dashboard-page__encabezado">
                <div>
                    <h1 id="dashboard-titulo" className="font-origenes dashboard-page__titulo">
                        {saludoSegunHora()}{primerNombre && `, ${primerNombre}`}
                    </h1>
                    <p className="dashboard-page__subtitulo">Así va el pulso de tus sucursales</p>
                </div>
                <span className="dashboard-page__acumulado">
                    <FaLayerGroup aria-hidden="true" /> Acumulado histórico
                </span>
            </header>
            {renderContenido()}
        </section>
    );
}