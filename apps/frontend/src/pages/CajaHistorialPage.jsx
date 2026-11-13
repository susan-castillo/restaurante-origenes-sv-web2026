import Button from '../components/Common/Button.jsx';
import { useEffect, useState } from 'react';
import { Alert, Form, Input, Label, Spinner, Table } from 'reactstrap';
import { esAdminCentral } from '../config/navegacion.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getHistorialCaja } from '../services/cajasService.js';
import { getSucursalesAdministracion } from '../services/sucursales.js';

const vacios = { fecha_inicio: '', fecha_fin: '', sucursal_id: '' };
const moneda = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });
const destacarDiferencia = (valor) => valor != null && valor !== 0 ? 'text-danger fw-semibold' : undefined;
const mostrarDiferencia = (valor) => valor == null ? 'Sin conciliar' : moneda.format(valor);
const fechaHora = new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'America/El_Salvador',
});

export default function CajaHistorialPage() {
    const { usuario } = useAuth();
    const central = esAdminCentral(usuario);
    const [sedes, setSedes] = useState([]);
    const [errorSedes, setErrorSedes] = useState('');
    const [filtros, setFiltros] = useState(vacios);
    const [consulta, setConsulta] = useState({ filtros: vacios, cursores: [null] });
    const [pagina, setPagina] = useState({ turnos: [], siguiente: null });
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [errorRango, setErrorRango] = useState('');

    useEffect(() => {
        if (!central) return;
        let vigente = true;
        getSucursalesAdministracion()
            .then((datos) => { if (vigente) setSedes(datos); })
            .catch(() => { if (vigente) setErrorSedes('No se pudo cargar el filtro de sucursales.'); });
        return () => { vigente = false; };
    }, [central]);

    useEffect(() => {
        let vigente = true;
        setCargando(true);
        setError('');
        getHistorialCaja({ ...consulta.filtros, antes_de: consulta.cursores.at(-1) })
            .then((datos) => { if (vigente) setPagina(datos); })
            .catch((err) => { if (vigente) setError(err.message || 'No se pudo cargar el historial.'); })
            .finally(() => { if (vigente) setCargando(false); });
        return () => { vigente = false; };
    }, [consulta]);

    const actualizarFiltro = ({ target: { name, value } }) => {
        setFiltros((actual) => ({ ...actual, [name]: value }));
        setErrorRango('');
    };

    const consultar = (event) => {
        event.preventDefault();
        const { fecha_inicio, fecha_fin } = filtros;
        if (Boolean(fecha_inicio) !== Boolean(fecha_fin) || fecha_inicio > fecha_fin) {
            setErrorRango('Selecciona ambas fechas y asegúrate de que la inicial no sea posterior a la final.');
            return;
        }
        setConsulta({ filtros, cursores: [null] });
    };

    const limpiar = () => {
        setFiltros(vacios);
        setErrorRango('');
        setConsulta({ filtros: vacios, cursores: [null] });
    };

    return (
        <section className="p-3 p-lg-4">
            <h1>Historial de caja</h1>
            <p>Consulta los turnos cerrados y sus cuadres por sede.</p>

            <Form onSubmit={consultar} className="border rounded p-3 mb-3">
                <div className="d-flex flex-wrap align-items-end gap-3">
                    <div>
                        <Label for="caja-fecha-inicio">Fecha inicial de cierre</Label>
                        <Input id="caja-fecha-inicio" type="date" name="fecha_inicio" value={filtros.fecha_inicio} onChange={actualizarFiltro} />
                    </div>
                    <div>
                        <Label for="caja-fecha-fin">Fecha final de cierre</Label>
                        <Input id="caja-fecha-fin" type="date" name="fecha_fin" value={filtros.fecha_fin} onChange={actualizarFiltro} />
                    </div>
                    {central && (
                        <div>
                            <Label for="caja-sucursal">Sucursal</Label>
                            <Input id="caja-sucursal" type="select" name="sucursal_id" value={filtros.sucursal_id} onChange={actualizarFiltro}>
                                <option value="">Todas las sucursales</option>
                                {sedes.map((sede) => <option key={sede.id} value={sede.id}>{sede.nombre}</option>)}
                            </Input>
                        </div>
                    )}
                    <Button type="submit" variant="secondary">Consultar</Button>
                    <Button type="button" variant="outline-secondary" onClick={limpiar}>Limpiar</Button>
                </div>
                {errorRango && <p role="alert" className="text-danger mt-2 mb-0">{errorRango}</p>}
                {central && errorSedes && <p role="status" className="mt-2 mb-0">{errorSedes}</p>}
            </Form>

            <p className="small">Fechas en hora de El Salvador. Las diferencias se calculan restando el importe esperado del reportado.</p>
            {cargando ? (
                <p role="status"><Spinner tag="span" aria-hidden="true" size="sm" className="me-2" />Cargando turnos…</p>
            ) : error ? (
                <Alert color="danger">
                    <p>{error}</p>
                    <Button variant="outline-danger" onClick={() => setConsulta({ ...consulta })}>Reintentar</Button>
                </Alert>
            ) : (
                <>
                    {pagina.turnos.length ? (
                        <Table responsive hover className="align-middle">
                            <caption className="visually-hidden">Cuadres de turnos cerrados</caption>
                            <thead>
                                <tr>
                                    {['Turno', 'Sucursal', 'Cajero', 'Cierre', 'Efectivo esperado', 'Efectivo contado',
                                        'Diferencia de efectivo', 'Ventas con tarjeta', 'Diferencia de tarjeta',
                                        'Ventas en Bitcoin', 'Diferencia de Bitcoin'].map((columna) => (
                                        <th key={columna} scope="col">{columna}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {pagina.turnos.map(({ id, sucursal, cajero, cerrado_en, cuadre_efectivo, cuadre_tarjeta, cuadre_bitcoin, ventas }) => {
                                    const { esperado_en_caja, reportado_por_cajero, diferencia } = cuadre_efectivo;
                                    return (
                                        <tr key={id}>
                                            <th scope="row">#{id}</th>
                                            <td>{sucursal}</td>
                                            <td>{cajero}</td>
                                            <td>{fechaHora.format(new Date(cerrado_en))}</td>
                                            <td>{moneda.format(esperado_en_caja)}</td>
                                            <td>{reportado_por_cajero === null ? 'Sin conteo' : moneda.format(reportado_por_cajero)}</td>
                                            <td className={destacarDiferencia(diferencia)}>
                                                {diferencia === null ? 'Sin conteo' : moneda.format(diferencia)}
                                            </td>
                                            <td>{moneda.format(ventas.tarjeta)}</td>
                                            <td className={destacarDiferencia(cuadre_tarjeta?.diferencia)}>{mostrarDiferencia(cuadre_tarjeta?.diferencia)}</td>
                                            <td>{moneda.format(ventas.bitcoin)}</td>
                                            <td className={destacarDiferencia(cuadre_bitcoin?.diferencia)}>{mostrarDiferencia(cuadre_bitcoin?.diferencia)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    ) : <p>No hay turnos cerrados para esta consulta.</p>}
                    {(consulta.cursores.length > 1 || pagina.siguiente !== null) && (
                        <nav aria-label="Páginas del historial de caja" className="d-flex gap-2 align-items-center">
                            <Button variant="outline-secondary" disabled={consulta.cursores.length === 1}
                                onClick={() => setConsulta({ ...consulta, cursores: consulta.cursores.slice(0, -1) })}>Anterior</Button>
                            <span>Página {consulta.cursores.length}</span>
                            <Button variant="outline-secondary" disabled={pagina.siguiente === null}
                                onClick={() => setConsulta({ ...consulta, cursores: [...consulta.cursores, pagina.siguiente] })}>Siguiente</Button>
                        </nav>
                    )}
                </>
            )}
        </section>
    );
}
