import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import { Alert, Button, Card, CardBody, CardTitle, Spinner } from 'reactstrap';
import { ArrowLeft } from 'lucide-react';
import SucursalForm from '../components/sucursales/SucursalForm.jsx';
import { getSucursalPorId } from '../services/sucursales.js';
import '../styles/sucursales.scss';

export default function SucursalDetallePage() {
    const { id } = useParams();
    const [parametros, setParametros] = useSearchParams();
    const { sincronizarSucursalActiva } = useOutletContext();
    const editando = parametros.get('editar') === '1';
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

    const cerrarEdicion = () => setParametros({}, { replace: true });

    const confirmarEdicion = (sedeActualizada) => {
        sincronizarSucursalActiva(sedeActualizada);
        setResultado({ id, intento, sucursal: sedeActualizada, guardada: true });
        cerrarEdicion();
    };

    return (
        <section className="sucursales-page" aria-labelledby="detalle-sucursal-titulo">
            <header className="sucursales-page__encabezado">
                <h1 id="detalle-sucursal-titulo" className="font-origenes">{sucursal?.nombre ?? 'Detalle de sede'}</h1>
            </header>

            {actual?.guardada && !editando && <Alert color="success" role="status">Se guardaron los cambios.</Alert>}

            {!idValido || error?.status === 404 ? (
                <Alert color="warning" role="alert">No se encontró la sucursal solicitada.</Alert>
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
                <SucursalForm key={id} sucursal={sucursal} onCancel={cerrarEdicion} onSaved={confirmarEdicion} />
            ) : (
                <Card className="sucursal-card sucursales-page__detalle">
                    <CardBody>
                        <CardTitle tag="h2">Información de la sede</CardTitle>
                        <dl className="sucursales-page__datos">
                            <div><dt>Nombre</dt><dd>{sucursal.nombre}</dd></div>
                            <div><dt>Dirección</dt><dd>{sucursal.direccion || 'Dirección no registrada'}</dd></div>
                            <div><dt>Estado actual</dt><dd>{sucursal.activa ? 'Activa' : 'Inactiva'}</dd></div>
                        </dl>
                        <Button tag={Link} to="?editar=1" color="primary" outline className="mt-3">
                            Editar sede
                        </Button>
                    </CardBody>
                </Card>
            )}

            <Button tag={Link} to="/admin/sucursales" color="primary" outline className="mt-4 d-inline-flex gap-2 align-items-center">
                <ArrowLeft size={18} aria-hidden="true" /> Volver a sucursales
            </Button>
        </section>
    );
}
