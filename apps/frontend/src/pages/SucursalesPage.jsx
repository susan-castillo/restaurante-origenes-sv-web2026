import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Alert, Input, Label, Spinner } from 'reactstrap';
import { Plus, Search, Store } from 'lucide-react';
import Button from '../components/Common/Button.jsx';
import SucursalCard from '../components/sucursales/SucursalCard.jsx';
import SucursalForm from '../components/sucursales/SucursalForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { esAdminCentral } from '../config/navegacion.js';
import { getSucursalesAdministracion } from '../services/sucursales.js';
import '../styles/sucursales.scss';

// Permite buscar "escalon" y encontrar "Escalón".
const normalizar = (texto) =>
    String(texto ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es')
        .trim();

export default function SucursalesPage() {
    const { usuario } = useAuth();
    const puedeGestionar = esAdminCentral(usuario);
    const { sincronizarSucursal } = useOutletContext() || {};
    const botonAgregar = useRef(null);

    const [sucursales, setSucursales] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [sucursalId, setSucursalId] = useState('');
    const [estado, setEstado] = useState('');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [intento, setIntento] = useState(0);
    const [formularioAbierto, setFormularioAbierto] = useState(false);
    const [confirmacion, setConfirmacion] = useState('');

    useEffect(() => {
        // Evita actualizar una pantalla desmontada o con una petición anterior.
        let vigente = true;
        const cargar = async () => {
            setCargando(true);
            setError('');
            try {
                const datos = await getSucursalesAdministracion();
                if (!Array.isArray(datos)) throw new Error('La respuesta de sucursales no es válida.');
                if (vigente) setSucursales(datos);
            } catch (err) {
                if (vigente) setError(err.message || 'No se pudieron cargar las sucursales.');
            } finally {
                if (vigente) setCargando(false);
            }
        };
        cargar();
        return () => {
            vigente = false;
        };
    }, [intento]);

    const termino = normalizar(busqueda);
    const filtradas = sucursales.filter(
        (sucursal) =>
            (!sucursalId || String(sucursal.id) === sucursalId) &&
            (!estado || sucursal.activa === (estado === 'activa')) &&
            normalizar(`${sucursal.nombre} ${sucursal.direccion ?? ''}`).includes(termino)
    );

    const limpiarFiltros = () => {
        setBusqueda('');
        setSucursalId('');
        setEstado('');
    };

    const cerrarFormulario = () => {
        setFormularioAbierto(false);
        botonAgregar.current?.focus();
    };

    const confirmarCreacion = (sucursal) => {
        sincronizarSucursal?.(sucursal);
        limpiarFiltros();
        setIntento((anterior) => anterior + 1);
        setConfirmacion(`Se creó la sucursal ${sucursal.nombre}.`);
        cerrarFormulario();
    };

    return (
        <div
            className="inventario-page sucursales-page"
            style={{ minWidth: 0, flex: '1 1 0%', maxWidth: '100%' }}
            aria-labelledby="sucursales-titulo"
        >
            {/* ENCABEZADO DEL PROYECTO */}
            <header className="inventario-header">
                <div>
                    <h1 id="sucursales-titulo" className="inventario-titulo">
                        Un mismo origen, distintas sedes
                    </h1>
                    <p className="inventario-subtitulo">
                        Consulta las sucursales, sus direcciones y su estado.
                    </p>
                </div>

                {puedeGestionar && (
                    <Button
                        variant="secondary"
                        ref={botonAgregar}
                        aria-expanded={formularioAbierto}
                        className="d-inline-flex align-items-center gap-2 text-white"
                        onClick={() => {
                            setConfirmacion('');
                            setFormularioAbierto(true);
                        }}
                    >
                        <Plus size={18} aria-hidden="true" /> Agregar sucursal
                    </Button>
                )}
            </header>

            {confirmacion && (
                <Alert color="success" role="status" className="rounded-3 mb-3">
                    {confirmacion}
                </Alert>
            )}

            {/* BARRA DE FILTROS CON ESTILO DE TARJETA DEL PROYECTO */}
            <div
                className="mb-3 p-3"
                role="search"
                aria-label="Buscar sucursales"
                style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #eadbd0',
                    borderRadius: '14px',
                }}
            >
                <div className="row g-4 align-items-end">
                    <div className="col-12 col-md-5">
                        <Label
                            for="buscar-sucursal"
                            className="form-label fw-semibold small"
                            style={{ color: '#613001' }}
                        >
                            Buscar sede
                        </Label>
                        <div className="position-relative">
                            <Search
                                size={17}
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    left: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: '#88685a',
                                    pointerEvents: 'none',
                                }}
                            />
                            <Input
                                id="buscar-sucursal"
                                type="search"
                                placeholder="Buscar por nombre o dirección..."
                                value={busqueda}
                                onChange={(event) => setBusqueda(event.target.value)}
                                style={{ paddingLeft: '36px' }}
                            />
                        </div>
                    </div>

                    <div className="col-12 col-sm-6 col-md-4">
                        <Label
                            for="filtro-sucursal"
                            className="form-label fw-semibold small"
                            style={{ color: '#613001' }}
                        >
                            Sucursal
                        </Label>
                        <Input
                            id="filtro-sucursal"
                            type="select"
                            value={sucursalId}
                            onChange={(event) => setSucursalId(event.target.value)}
                        >
                            <option value="">Todas las sucursales</option>
                            {sucursales.map((sucursal) => (
                                <option key={sucursal.id} value={sucursal.id}>
                                    {sucursal.nombre}
                                </option>
                            ))}
                        </Input>
                    </div>

                    <div className="col-12 col-sm-6 col-md-3">
                        <Label
                            for="filtro-estado"
                            className="form-label fw-semibold small"
                            style={{ color: '#613001' }}
                        >
                            Estado
                        </Label>
                        <Input
                            id="filtro-estado"
                            type="select"
                            value={estado}
                            onChange={(event) => setEstado(event.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            <option value="activa">Activas</option>
                            <option value="inactiva">Inactivas</option>
                        </Input>
                    </div>
                </div>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            <main className="inventario-contenido mt-0">
                {cargando ? (
                    <div className="inventario-mensaje" role="status">
                        <Spinner size="sm" aria-hidden="true" className="me-2" />
                        Cargando sucursales…
                    </div>
                ) : error ? (
                    <Alert color="danger" role="alert" className="rounded-3">
                        <p className="mb-2">{error}</p>
                        <Button
                            variant="outline-danger"
                            onClick={() => setIntento((actual) => actual + 1)}
                        >
                            Reintentar
                        </Button>
                    </Alert>
                ) : (
                    <>
                        <p className="inventario-subtitulo mb-3" role="status">
                            {filtradas.length}{' '}
                            {filtradas.length === 1 ? 'sucursal encontrada' : 'sucursales encontradas'}
                        </p>

                        {filtradas.length > 0 ? (
                            <div className="sucursales-page__grid">
                                {filtradas.map((sucursal) => (
                                    <SucursalCard
                                        key={sucursal.id}
                                        sucursal={sucursal}
                                        puedeGestionar={puedeGestionar}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div
                                className="inventario-tabla-contenedor text-center py-5 px-3"
                                style={{ border: '1px solid #eadbd0' }}
                            >
                                <Store size={32} aria-hidden="true" style={{ color: '#88685a' }} className="mb-2" />
                                <h2
                                    className="h5 mb-1"
                                    style={{ fontFamily: '"DM Serif Display", serif', color: '#261c14' }}
                                >
                                    {sucursales.length ? 'No hay coincidencias' : 'No hay sucursales registradas'}
                                </h2>
                                <p className="inventario-subtitulo mb-3">
                                    {sucursales.length
                                        ? 'Prueba con otros filtros.'
                                        : 'Las sucursales aparecerán aquí cuando estén disponibles.'}
                                </p>
                                {(busqueda || sucursalId || estado) && (
                                    <Button variant="outline-secondary" onClick={limpiarFiltros}>
                                        Limpiar filtros
                                    </Button>
                                )}
                            </div>
                        )}
                    </>
                )}

                {puedeGestionar && formularioAbierto && (
                    <SucursalForm onCancel={cerrarFormulario} onSaved={confirmarCreacion} />
                )}
            </main>
        </div>
    );
}