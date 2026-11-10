import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Alert, Button, Input, Label, Spinner } from 'reactstrap';
import { Plus, Search, Store } from 'lucide-react';
import SucursalCard from '../components/sucursales/SucursalCard.jsx';
import SucursalNuevaForm from '../components/sucursales/SucursalNuevaForm.jsx';
import { getSucursalesAdministracion } from '../services/sucursales.js';
import '../styles/sucursales.scss';

// Permite buscar "escalon" y encontrar "Escalón".
const normalizar = (texto) => String(texto ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();

export default function SucursalesPage() {
    const { registrarSucursalActiva } = useOutletContext();
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
        return () => { vigente = false; };
    }, [intento]);

    const termino = normalizar(busqueda);
    const filtradas = sucursales.filter((sucursal) =>
        (!sucursalId || String(sucursal.id) === sucursalId)
        && (!estado || sucursal.activa === (estado === 'activa'))
        && normalizar(`${sucursal.nombre} ${sucursal.direccion ?? ''}`).includes(termino));

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
        registrarSucursalActiva(sucursal);
        limpiarFiltros();
        setIntento((anterior) => anterior + 1);
        setConfirmacion(`Se creó la sucursal ${sucursal.nombre}.`);
        cerrarFormulario();
    };

    return (
        <section className="sucursales-page" aria-labelledby="sucursales-titulo">
            <header className="sucursales-page__encabezado d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div>
                    <h1 id="sucursales-titulo" className="font-origenes">Un mismo origen, distintas sedes</h1>
                    <p>Consulta las sucursales, sus direcciones y su estado.</p>
                </div>
                <Button color="primary" innerRef={botonAgregar} aria-expanded={formularioAbierto}
                    className="d-inline-flex align-items-center gap-2"
                    onClick={() => {
                        setConfirmacion('');
                        setFormularioAbierto(true);
                    }}>
                    <Plus size={18} aria-hidden="true" /> Agregar sucursal
                </Button>
            </header>

            {confirmacion && <Alert color="success" role="status">{confirmacion}</Alert>}

            <div className="sucursales-page__filtros" role="search" aria-label="Buscar sucursales">
                <div>
                    <Label for="buscar-sucursal" className="visually-hidden">Buscar por nombre o dirección</Label>
                    <div className="sucursales-page__buscador">
                        <Search size={19} aria-hidden="true" />
                        <Input id="buscar-sucursal" type="search" placeholder="Buscar por nombre o dirección"
                            value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
                    </div>
                </div>
                <div>
                    <Label for="filtro-sucursal" className="visually-hidden">Sucursal</Label>
                    <Input id="filtro-sucursal" type="select" value={sucursalId}
                        onChange={(event) => setSucursalId(event.target.value)}>
                        <option value="">Todas las sucursales</option>
                        {sucursales.map((sucursal) => (
                            <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                        ))}
                    </Input>
                </div>
                <div>
                    <Label for="filtro-estado" className="visually-hidden">Estado</Label>
                    <Input id="filtro-estado" type="select" value={estado}
                        onChange={(event) => setEstado(event.target.value)}>
                        <option value="">Todos los estados</option>
                        <option value="activa">Activas</option>
                        <option value="inactiva">Inactivas</option>
                    </Input>
                </div>
            </div>

            {cargando ? (
                <div className="sucursales-page__mensaje" role="status">
                    <Spinner size="sm" aria-hidden="true" /> Cargando sucursales…
                </div>
            ) : error ? (
                <Alert color="danger" role="alert">
                    <p>{error}</p>
                    <Button color="danger" outline onClick={() => setIntento((actual) => actual + 1)}>Reintentar</Button>
                </Alert>
            ) : (
                <>
                    <p className="sucursales-page__conteo" role="status">
                        {filtradas.length} {filtradas.length === 1 ? 'sucursal encontrada' : 'sucursales encontradas'}
                    </p>
                    {filtradas.length > 0 ? (
                        <div className="sucursales-page__grid">
                            {filtradas.map((sucursal) => <SucursalCard key={sucursal.id} sucursal={sucursal} />)}
                        </div>
                    ) : (
                        <div className="sucursales-page__mensaje">
                            <Store size={32} aria-hidden="true" />
                            <h2>{sucursales.length ? 'No hay coincidencias' : 'No hay sucursales registradas'}</h2>
                            <p>{sucursales.length ? 'Prueba con otros filtros.' : 'Las sucursales aparecerán aquí cuando estén disponibles.'}</p>
                            {(busqueda || sucursalId || estado) && <Button color="primary" outline onClick={limpiarFiltros}>Limpiar filtros</Button>}
                        </div>
                    )}
                </>
            )}
            {formularioAbierto && <SucursalNuevaForm onCancel={cerrarFormulario} onCreated={confirmarCreacion} />}
        </section>
    );
}
