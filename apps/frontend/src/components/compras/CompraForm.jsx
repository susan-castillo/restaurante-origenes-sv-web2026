import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, CardBody, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import { obtenerInsumos } from '../../services/insumosService.js';
import { getProveedores, registrarCompra } from '../../services/comprasService.js';

const moneda = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });
const filaNueva = (id) => ({ id, insumo: '', cantidad: '', costo: '' });

export default function CompraForm({ usuario, onCancel, onSaved }) {
    const siguienteFila = useRef(2);
    const [proveedores, setProveedores] = useState([]);
    const [insumos, setInsumos] = useState([]);
    const [proveedor, setProveedor] = useState('');
    const [factura, setFactura] = useState('');
    const [vencimiento, setVencimiento] = useState('');
    const [filas, setFilas] = useState(() => [filaNueva(1)]);
    const [cargando, setCargando] = useState(true);
    const [intento, setIntento] = useState(0);
    const [guardando, setGuardando] = useState(false);
    const [errorCarga, setErrorCarga] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let vigente = true;
        async function cargarCatalogos() {
            setCargando(true);
            setErrorCarga('');
            try {
                const [listaProveedores, listaInsumos] = await Promise.all([getProveedores(), obtenerInsumos()]);
                if (vigente) {
                    setProveedores(listaProveedores);
                    setInsumos(listaInsumos.filter((insumo) => insumo.activo));
                }
            } catch (err) {
                if (vigente) setErrorCarga(err.message || 'No se pudieron cargar los catálogos.');
            } finally {
                if (vigente) setCargando(false);
            }
        }
        cargarCatalogos();
        return () => { vigente = false; };
    }, [intento]);

    const total = filas.reduce((suma, fila) => suma + Number(fila.cantidad) * Number(fila.costo), 0);
    const puedeGuardar = !cargando && !errorCarga && proveedores.length > 0 && insumos.length > 0;
    const actualizarFila = (id, campo, valor) => {
        setFilas((actuales) => actuales.map((fila) => fila.id === id ? { ...fila, [campo]: valor } : fila));
    };

    async function guardar(evento) {
        evento.preventDefault();
        if (guardando || !puedeGuardar) return;

        const numeroFactura = factura.trim();
        if (!numeroFactura || !proveedor || filas.some((fila) => !fila.insumo
            || !fila.cantidad || !fila.costo || Number(fila.cantidad) <= 0 || Number(fila.costo) < 0)) {
            setError('Completa la factura y los datos de cada insumo.');
            return;
        }
        if (!Number.isFinite(total) || total >= 100000000) {
            setError('El total supera el importe admitido por factura.');
            return;
        }

        setGuardando(true);
        setError('');
        try {
            const { compra } = await registrarCompra({
                proveedor_id: Number(proveedor),
                numero_factura: numeroFactura,
                fecha_vencimiento: vencimiento || null,
                detalles: filas.map((fila) => ({
                    insumo_id: Number(fila.insumo),
                    cantidad: Number(fila.cantidad),
                    costo_unitario: Number(fila.costo),
                })),
            });
            onSaved(compra);
        } catch (err) {
            setError(err.message || 'No se pudo registrar la compra.');
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Card>
            <CardBody>
                <h2 className="h5">Registrar compra</h2>
                <p className="text-muted">Sucursal: {usuario.sucursales?.nombre || usuario.sucursal || usuario.sucursal_id} · Pendiente de pago</p>
                {cargando && <p role="status">Cargando proveedores e insumos…</p>}
                {errorCarga && (
                    <Alert color="danger" role="alert">
                        <p>{errorCarga}</p>
                        <Button outline color="danger" onClick={() => setIntento((actual) => actual + 1)}>Reintentar</Button>
                    </Alert>
                )}
                {!cargando && !errorCarga && !puedeGuardar && (
                    <Alert color="warning">Se necesita al menos un proveedor y un insumo activo.</Alert>
                )}
                {error && <Alert color="danger" role="alert">{error}</Alert>}
                <Form onSubmit={guardar} aria-busy={guardando}>
                    <fieldset disabled={guardando || !puedeGuardar}>
                        <Row className="g-3 mb-3">
                            <Col md={4}><FormGroup className="mb-0">
                                <Label for="compra-proveedor">Proveedor</Label>
                                <Input id="compra-proveedor" type="select" required value={proveedor} onChange={(e) => setProveedor(e.target.value)}>
                                    <option value="">Selecciona un proveedor</option>
                                    {proveedores.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                                </Input>
                            </FormGroup></Col>
                            <Col md={4}><FormGroup className="mb-0">
                                <Label for="compra-factura">Número de factura</Label>
                                <Input id="compra-factura" required maxLength={30} value={factura} onChange={(e) => setFactura(e.target.value)} />
                            </FormGroup></Col>
                            <Col md={4}><FormGroup className="mb-0">
                                <Label for="compra-vencimiento">Vencimiento (opcional)</Label>
                                <Input id="compra-vencimiento" type="date" value={vencimiento} onChange={(e) => setVencimiento(e.target.value)} />
                            </FormGroup></Col>
                        </Row>
                        <h3 className="h6">Insumos de la factura</h3>
                        {filas.map((fila, indice) => (
                            <Row key={fila.id} className="g-2 align-items-end mb-3">
                                <Col md={4}>
                                    <Label for={`compra-insumo-${fila.id}`}>Insumo {indice + 1}</Label>
                                    <Input id={`compra-insumo-${fila.id}`} type="select" required value={fila.insumo}
                                        onChange={(e) => actualizarFila(fila.id, 'insumo', e.target.value)}>
                                        <option value="">Selecciona un insumo</option>
                                        {insumos.map((item) => <option key={item.id} value={item.id}>{item.nombre} ({item.unidad})</option>)}
                                    </Input>
                                </Col>
                                <Col md={2}>
                                    <Label for={`compra-cantidad-${fila.id}`}>Cantidad</Label>
                                    <Input id={`compra-cantidad-${fila.id}`} type="number" required min="0.001" max="999999999.999" step="0.001"
                                        value={fila.cantidad} onChange={(e) => actualizarFila(fila.id, 'cantidad', e.target.value)} />
                                </Col>
                                <Col md={2}>
                                    <Label for={`compra-costo-${fila.id}`}>Costo unitario</Label>
                                    <Input id={`compra-costo-${fila.id}`} type="number" required min="0" max="999999.9999" step="0.0001"
                                        value={fila.costo} onChange={(e) => actualizarFila(fila.id, 'costo', e.target.value)} />
                                </Col>
                                <Col md={2}><span className="d-block">Subtotal</span>{moneda.format(Number(fila.cantidad) * Number(fila.costo))}</Col>
                                <Col md={2}>
                                    <Button type="button" outline color="danger" disabled={filas.length === 1}
                                        aria-label={`Quitar insumo ${indice + 1}`}
                                        onClick={() => setFilas((actuales) => actuales.filter((item) => item.id !== fila.id))}>
                                        Quitar
                                    </Button>
                                </Col>
                            </Row>
                        ))}
                        <Button type="button" outline color="primary" onClick={() => {
                            const nueva = filaNueva(siguienteFila.current++);
                            setFilas((actuales) => [...actuales, nueva]);
                        }}>Agregar insumo</Button>
                    </fieldset>
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4">
                        <strong>Total: {moneda.format(total)}</strong>
                        <div className="d-flex gap-2">
                            <Button type="button" outline color="secondary" disabled={guardando} onClick={onCancel}>Cancelar</Button>
                            <Button type="submit" color="primary" disabled={guardando || !puedeGuardar}>
                                {guardando ? 'Registrando…' : 'Registrar compra'}
                            </Button>
                        </div>
                    </div>
                </Form>
            </CardBody>
        </Card>
    );
}
