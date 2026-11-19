import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Alert, Form, Input, Label, Spinner } from 'reactstrap';
import Button from '../components/Common/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getHistorialCaja } from '../services/cajasService.js';

const fechasVacias = { fecha_inicio: '', fecha_fin: '' };
const moneda = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });
const destacarDiferencia = (valor) => (valor != null && valor !== 0 ? 'text-danger fw-semibold' : undefined);
const mostrarDiferencia = (valor) => (valor == null ? 'Sin conciliar' : moneda.format(valor));
const fechaHora = new Intl.DateTimeFormat('es-SV', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/El_Salvador',
});

export default function CajaHistorialPage() {
    const { usuario, cargando: cargandoSesion } = useAuth();
    const { sucursalSeleccionada } = useOutletContext() || {};
    const sucursalId = sucursalSeleccionada?.id || usuario?.sucursal_id || '';

    const [filtrosFecha, setFiltrosFecha] = useState(fechasVacias);
    const [consulta, setConsulta] = useState({ fechas: fechasVacias, cursores: [null] });
    const [pagina, setPagina] = useState({ turnos: [], siguiente: null });
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [errorRango, setErrorRango] = useState('');

    // Reinicia la paginación si cambia la sucursal en el Navbar
    useEffect(() => {
        setConsulta((actual) => ({ ...actual, cursores: [null] }));
    }, [sucursalId]);

    // Consulta el historial filtrando por la sucursal del Navbar y el rango de fechas
    useEffect(() => {
        if (cargandoSesion) return;

        if (!sucursalId) {
            setPagina({ turnos: [], siguiente: null });
            setCargando(false);
            return;
        }

        let vigente = true;
        setCargando(true);
        setError('');

        getHistorialCaja({
            ...consulta.fechas,
            sucursal_id: sucursalId,
            antes_de: consulta.cursores.at(-1),
        })
            .then((datos) => {
                if (vigente) setPagina(datos);
            })
            .catch((err) => {
                if (vigente) setError(err.message || 'No se pudo cargar el historial.');
            })
            .finally(() => {
                if (vigente) setCargando(false);
            });

        return () => {
            vigente = false;
        };
    }, [consulta, sucursalId, cargandoSesion]);

    const actualizarFecha = ({ target: { name, value } }) => {
        setFiltrosFecha((actual) => ({ ...actual, [name]: value }));
        setErrorRango('');
    };

    const consultar = (event) => {
        event.preventDefault();
        const { fecha_inicio, fecha_fin } = filtrosFecha;
        if (Boolean(fecha_inicio) !== Boolean(fecha_fin) || fecha_inicio > fecha_fin) {
            setErrorRango('Selecciona ambas fechas y asegúrate de que la inicial no sea posterior a la final.');
            return;
        }
        setConsulta({ fechas: filtrosFecha, cursores: [null] });
    };

    const limpiar = () => {
        setFiltrosFecha(fechasVacias);
        setErrorRango('');
        setConsulta({ fechas: fechasVacias, cursores: [null] });
    };

    return (
        <div className="inventario-page" style={{ minWidth: 0, flex: '1 1 0%', maxWidth: '100%' }}>
            {/* ENCABEZADO DEL PROYECTO */}
            <header className="inventario-header">
                <div>
                    <h1 className="inventario-titulo">Historial de caja</h1>
                    <p className="inventario-subtitulo">
                        {sucursalSeleccionada?.nombre
                            ? `Turnos cerrados y cuadres de ${sucursalSeleccionada.nombre}`
                            : 'Consulta los turnos cerrados y sus cuadres por sede.'}
                    </p>
                </div>
            </header>

            {/* FILTROS POR FECHA */}
            <Form
                onSubmit={consultar}
                className="mb-3 p-3"
                style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #eadbd0',
                    borderRadius: '14px',
                }}
            >
                <div className="d-flex flex-wrap align-items-end gap-3">
                    <div>
                        <Label for="caja-fecha-inicio" className="form-label fw-semibold small" style={{ color: '#613001' }}>
                            Fecha inicial de cierre
                        </Label>
                        <Input
                            id="caja-fecha-inicio"
                            type="date"
                            name="fecha_inicio"
                            value={filtrosFecha.fecha_inicio}
                            onChange={actualizarFecha}
                        />
                    </div>

                    <div>
                        <Label for="caja-fecha-fin" className="form-label fw-semibold small" style={{ color: '#613001' }}>
                            Fecha final de cierre
                        </Label>
                        <Input
                            id="caja-fecha-fin"
                            type="date"
                            name="fecha_fin"
                            value={filtrosFecha.fecha_fin}
                            onChange={actualizarFecha}
                        />
                    </div>

                    <div className="d-flex gap-2">
                        <Button type="submit" variant="secondary" className="text-white" text="Consultar" />
                        <Button type="button" variant="outline-secondary" onClick={limpiar} text="Limpiar" />
                    </div>
                </div>

                {errorRango && (
                    <p role="alert" className="text-danger small mt-2 mb-0">
                        {errorRango}
                    </p>
                )}
            </Form>

            <p className="inventario-subtitulo mb-3">
                Fechas en hora de El Salvador. Las diferencias se calculan restando el importe esperado del reportado.
            </p>

            {/* CONTENIDO PRINCIPAL */}
            <main className="inventario-contenido mt-0">
                {!sucursalId && !cargandoSesion ? (
                    <div className="alert alert-info" role="alert">
                        Selecciona una sucursal en la barra superior para ver su historial de caja.
                    </div>
                ) : cargando ? (
                    <div className="inventario-mensaje" role="status">
                        <Spinner tag="span" aria-hidden="true" size="sm" className="me-2" />
                        Cargando turnos…
                    </div>
                ) : error ? (
                    <Alert color="danger" className="rounded-3">
                        <p className="mb-2">{error}</p>
                        <Button
                            variant="outline-danger"
                            onClick={() => setConsulta({ ...consulta })}
                            text="Reintentar"
                        />
                    </Alert>
                ) : (
                    <>
                        {pagina.turnos.length ? (
                            <div
                                className="inventario-tabla-contenedor"
                                style={{
                                    maxHeight: '540px',
                                    overflowY: 'auto',
                                    border: '1px solid #eadbd0',
                                }}
                            >
                                <table className="inventario-tabla">
                                    <caption className="visually-hidden">Cuadres de turnos cerrados</caption>
                                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                    <tr>
                                        {[
                                            'Turno',
                                            'Sucursal',
                                            'Cajero',
                                            'Cierre',
                                            'Efectivo esperado',
                                            'Efectivo contado',
                                            'Diferencia de efectivo',
                                            'Ventas con tarjeta',
                                            'Diferencia de tarjeta',
                                            'Ventas en Bitcoin',
                                            'Diferencia de Bitcoin',
                                        ].map((columna) => (
                                            <th key={columna} scope="col">
                                                {columna}
                                            </th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {pagina.turnos.map(
                                        ({
                                             id,
                                             sucursal,
                                             cajero,
                                             cerrado_en,
                                             cuadre_efectivo,
                                             cuadre_tarjeta,
                                             cuadre_bitcoin,
                                             ventas,
                                         }) => {
                                            const { esperado_en_caja, reportado_por_cajero, diferencia } = cuadre_efectivo;
                                            return (
                                                <tr key={id}>
                                                    <td className="inventario-nombre">#{id}</td>
                                                    <td>{sucursal}</td>
                                                    <td>{cajero}</td>
                                                    <td className="text-nowrap">
                                                        {fechaHora.format(new Date(cerrado_en))}
                                                    </td>
                                                    <td>{moneda.format(esperado_en_caja)}</td>
                                                    <td>
                                                        {reportado_por_cajero === null
                                                            ? 'Sin conteo'
                                                            : moneda.format(reportado_por_cajero)}
                                                    </td>
                                                    <td className={destacarDiferencia(diferencia)}>
                                                        {diferencia === null ? 'Sin conteo' : moneda.format(diferencia)}
                                                    </td>
                                                    <td>{moneda.format(ventas.tarjeta)}</td>
                                                    <td className={destacarDiferencia(cuadre_tarjeta?.diferencia)}>
                                                        {mostrarDiferencia(cuadre_tarjeta?.diferencia)}
                                                    </td>
                                                    <td>{moneda.format(ventas.bitcoin)}</td>
                                                    <td className={destacarDiferencia(cuadre_bitcoin?.diferencia)}>
                                                        {mostrarDiferencia(cuadre_bitcoin?.diferencia)}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div
                                className="inventario-tabla-contenedor"
                                style={{ border: '1px solid #eadbd0' }}
                            >
                                <p className="inventario-mensaje mb-0">
                                    No hay turnos cerrados para esta consulta.
                                </p>
                            </div>
                        )}

                        {(consulta.cursores.length > 1 || pagina.siguiente !== null) && (
                            <nav
                                aria-label="Páginas del historial de caja"
                                className="d-flex gap-3 align-items-center justify-content-end mt-3"
                            >
                                <Button
                                    variant="outline-secondary"
                                    disabled={consulta.cursores.length === 1}
                                    onClick={() =>
                                        setConsulta({
                                            ...consulta,
                                            cursores: consulta.cursores.slice(0, -1),
                                        })
                                    }
                                    text="Anterior"
                                />
                                <span className="small fw-semibold" style={{ color: '#88685a' }}>
                                    Página {consulta.cursores.length}
                                </span>
                                <Button
                                    variant="outline-secondary"
                                    disabled={pagina.siguiente === null}
                                    onClick={() =>
                                        setConsulta({
                                            ...consulta,
                                            cursores: [...consulta.cursores, pagina.siguiente],
                                        })
                                    }
                                    text="Siguiente"
                                />
                            </nav>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}