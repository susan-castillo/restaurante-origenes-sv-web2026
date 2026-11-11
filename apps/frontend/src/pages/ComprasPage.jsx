import { useState } from 'react';
import { Alert, Button, Card, CardBody, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import { getResumenCompras } from '../services/comprasService.js';

const moneda = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });
const conteo = new Intl.NumberFormat('es-SV');
const campos = [
    { clave: 'gastos_totales', titulo: 'Gastos totales' },
    { clave: 'total_pagado', titulo: 'Total pagado' },
    { clave: 'cuentas_por_pagar', titulo: 'Cuentas por pagar' },
];

export default function ComprasPage() {
    const [fin, setFin] = useState(() => new Date().toISOString().slice(0, 10));
    const [inicio, setInicio] = useState(() => `${fin.slice(0, 7)}-01`);
    const [resultado, setResultado] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    async function consultar(evento) {
        evento.preventDefault();
        if (cargando) return;

        setResultado(null);
        if (!inicio || !fin || inicio > fin) {
            setError('Selecciona un rango válido. La fecha final debe ser igual o posterior a la inicial.');
            return;
        }

        setCargando(true);
        setError('');
        try {
            const datos = await getResumenCompras(inicio, fin);
            if (!datos?.resumen || !datos?.rango) {
                throw new Error('No se recibió el resumen de compras.');
            }
            setResultado(datos);
        } catch (err) {
            setError(err.message || 'No se pudo consultar el resumen de compras.');
        } finally {
            setCargando(false);
        }
    }

    return (
        <section aria-labelledby="compras-titulo">
            <header className="mb-4">
                <h1 id="compras-titulo" className="font-origenes mb-2">Compras</h1>
                <p className="text-muted mb-0">Consulta los costos y las cuentas por pagar de un período.</p>
            </header>

            <Card className="mb-4">
                <CardBody>
                    <h2 className="h5 mb-3">Resumen de costos y gastos</h2>
                    <Form onSubmit={consultar} aria-busy={cargando}>
                        <fieldset disabled={cargando}>
                            <Row className="align-items-end g-3">
                                <Col md={4}>
                                    <FormGroup className="mb-0">
                                        <Label for="compras-inicio">Fecha inicial</Label>
                                        <Input type="date" id="compras-inicio" required value={inicio}
                                            onChange={(evento) => setInicio(evento.target.value)} />
                                    </FormGroup>
                                </Col>
                                <Col md={4}>
                                    <FormGroup className="mb-0">
                                        <Label for="compras-fin">Fecha final</Label>
                                        <Input type="date" id="compras-fin" required value={fin}
                                            onChange={(evento) => setFin(evento.target.value)} />
                                    </FormGroup>
                                </Col>
                                <Col md="auto">
                                    <Button color="primary" type="submit">
                                        {cargando ? 'Consultando…' : 'Consultar resumen'}
                                    </Button>
                                </Col>
                            </Row>
                        </fieldset>
                    </Form>
                </CardBody>
            </Card>

            {error && <Alert color="danger" role="alert">{error}</Alert>}
            {cargando && <p role="status">Cargando resumen de compras…</p>}

            {resultado && (
                <section aria-label="Resultados de compras">
                    <p className="text-muted" role="status">
                        {resultado.rango.inicio} al {resultado.rango.fin} (UTC)
                        {' · '}{conteo.format(resultado.cantidad_transacciones)}
                        {resultado.cantidad_transacciones === 1 ? ' compra' : ' compras'}
                    </p>
                    {resultado.cantidad_transacciones === 0 && (
                        <Alert color="info">No se encontraron compras para este período.</Alert>
                    )}
                    <Row className="g-3">
                        {campos.map(({ clave, titulo }) => (
                            <Col md={4} key={clave}>
                                <Card className="h-100">
                                    <CardBody>
                                        <h3 className="h6 text-muted">{titulo}</h3>
                                        <p className="fs-4 fw-semibold mb-0">{moneda.format(resultado.resumen[clave])}</p>
                                    </CardBody>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </section>
            )}
        </section>
    );
}
