import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, CardBody, CardTitle, Spinner } from 'reactstrap';
import { ArrowLeft } from 'lucide-react';
import SucursalForm from '../components/sucursales/SucursalForm.jsx';
import SucursalEstadoConfirmacion from '../components/sucursales/SucursalEstadoConfirmacion.jsx';
import SucursalMetricas from '../components/sucursales/SucursalMetricas.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { esAdminCentral } from '../config/navegacion.js';
import { getSucursalPorId } from '../services/sucursales.js';
import '../styles/sucursales.scss';

export default function SucursalDetallePage() {
    const { id } = useParams();
    const { usuario } = useAuth();
    const puedeGestionar = esAdminCentral(usuario);
    const [parametros, setParametros] = useSearchParams();
    const { sincronizarSucursal } = useOutletContext();
    const editando = puedeGestionar && parametros.get('editar') === '1';
    const confirmandoEstado = puedeGestionar && !editando && parametros.get('estado') === '1';
    const idValido = /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));
    const [resultado, setResultado] = useState(null);
    const [intento, setIntento] = useState(0);
    const actual = resultado?.id === id && resultado.intento === intento ? resultado : null;

    useEffect(() => {
        if (!idValido) return;
        let vigente = true;

        async function cargarDetalle() {
            try {
                const sucursal = await getSucursalPorId(id);
                if (vigente) setResultado({ id, intento, sucursal });
            } catch (error) {
                if (vigente) setResultado({ id, intento, error });
            }
        }

        cargarDetalle();
        return () => { vigente = false; };
    }, [id, idValido, intento]);

    const sucursal = actual?.sucursal;
    const error = actual?.error;

    const cerrarAccion = () => setParametros({}, { replace: true });

    const guardarResultado = (sedeActualizada, mensaje) => {
        sincronizarSucursal(sedeActualizada);
        setResultado({ id, intento, sucursal: { ...sedeActualizada, resumen: sucursal.resumen }, mensaje });
        cerrarAccion();
    };

    return (
        <section className="sucursales-page" aria-labelledby="detalle-sucursal-titulo">
            <header className="sucursales-page__encabezado">
                <h1 id="detalle-sucursal-titulo" className="font-origenes">{sucursal?.nombre ?? 'Detalle de sede'}</h1>
            </header>

            {actual?.mensaje && !editando && !confirmandoEstado && (
                <Alert color="success" role="status">{actual.mensaje}</Alert>
            )}

            {!idValido || error?.status === 404 ? (
                <Alert color="warning" role="alert">No se encontró la sucursal solicitada.</Alert>
            ) : error?.status === 403 ? (
                <Alert color="warning" role="alert">{error.message}</Alert>
            ) : error ? (
                <Alert color="danger" role="alert">
                    <p>{error.message || 'No se pudo cargar la sucursal.'}</p>
                    <Button color="danger" outline onClick={() => setIntento((anterior) => anterior + 1)}>
                        Reintentar
                    </Button>
                </Alert>
            ) : !actual ? (
                <div className="sucursales-page__mensaje" role="status">
                    <Spinner size="sm" aria-hidden="true" /> Cargando sede…
                </div>
            ) : editando ? (
                <SucursalForm key={id} sucursal={sucursal} onCancel={cerrarAccion}
                    onSaved={(sede) => guardarResultado(sede, 'Se guardaron los cambios.')} />
            ) : (
                <div className={confirmandoEstado ? 'sucursales-page__detalle-con-estado' : 'sucursales-page__detalle'}>
                    <Card className="sucursal-card">
                        <CardBody>
                            <CardTitle tag="h2">Información de la sede</CardTitle>
                            <dl className="sucursales-page__datos">
                                <div><dt>Nombre</dt><dd>{sucursal.nombre}</dd></div>
                                <div><dt>Dirección</dt><dd>{sucursal.direccion || 'Dirección no registrada'}</dd></div>
                                <div><dt>Estado actual</dt><dd>{sucursal.activa ? 'Activa' : 'Inactiva'}</dd></div>
                            </dl>
                            <SucursalMetricas resumen={sucursal.resumen} detalle />
                            {puedeGestionar && !confirmandoEstado && (
                                <div className="d-flex flex-wrap gap-2 mt-3">
                                    <Button tag={Link} to="?editar=1" color="primary" outline>Editar sede</Button>
                                    <Button tag={Link} to="?estado=1" color={sucursal.activa ? 'danger' : 'primary'} outline>
                                        {sucursal.activa ? 'Desactivar sede' : 'Activar sede'}
                                    </Button>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                    {confirmandoEstado && (
                        <SucursalEstadoConfirmacion key={id} sucursal={sucursal} onCancel={cerrarAccion}
                            onSaved={(sede) => guardarResultado(sede, sede.activa ? 'Se activó la sucursal.' : 'Se desactivó la sucursal.')} />
                    )}
                </div>
            )}

            <Button tag={Link} to="/admin/sucursales" color="primary" outline className="mt-4 d-inline-flex gap-2 align-items-center">
                <ArrowLeft size={18} aria-hidden="true" /> Volver a sucursales
            </Button>
        </section>
    );
}
