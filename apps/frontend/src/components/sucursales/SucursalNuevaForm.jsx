import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, CardBody, CardTitle, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import { crearSucursal } from '../../services/sucursales.js';

export default function SucursalNuevaForm({ onCancel, onCreated }) {
    const campoNombre = useRef(null);
    const [nombre, setNombre] = useState('');
    const [direccion, setDireccion] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        campoNombre.current?.focus();
    }, []);

    async function guardar(event) {
        event.preventDefault();
        if (guardando) return;

        const nombreLimpio = nombre.trim();
        const direccionLimpia = direccion.trim();
        if (!nombreLimpio || !direccionLimpia) {
            setError('Ingresa el nombre y la dirección de la sede.');
            return;
        }

        setGuardando(true);
        setError('');
        try {
            const { sucursal } = await crearSucursal(nombreLimpio, direccionLimpia);
            onCreated(sucursal);
        } catch (err) {
            setError(err.message || 'No se pudo crear la sucursal.');
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Card tag="section" className="sucursal-card mt-4" aria-labelledby="nueva-sucursal-titulo">
            <CardBody>
                <CardTitle tag="h2" id="nueva-sucursal-titulo">Nueva sucursal</CardTitle>
                <Form onSubmit={guardar} aria-busy={guardando}>
                    {error && <Alert color="danger" role="alert">{error}</Alert>}
                    <fieldset disabled={guardando}>
                        <Row className="g-3">
                            <Col md={5}>
                                <FormGroup>
                                    <Label for="sucursal-nueva-nombre">Nombre</Label>
                                    <Input id="sucursal-nueva-nombre" innerRef={campoNombre} required
                                        maxLength={100} value={nombre} onChange={(event) => setNombre(event.target.value)} />
                                </FormGroup>
                            </Col>
                            <Col md={5}>
                                <FormGroup>
                                    <Label for="sucursal-nueva-direccion">Dirección</Label>
                                    <Input id="sucursal-nueva-direccion" required maxLength={200}
                                        value={direccion} onChange={(event) => setDireccion(event.target.value)} />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <FormGroup>
                                    <Label for="sucursal-nueva-estado">Estado inicial</Label>
                                    <Input id="sucursal-nueva-estado" value="Activa" readOnly />
                                </FormGroup>
                            </Col>
                        </Row>
                        <div className="d-flex flex-wrap justify-content-end gap-2">
                            <Button type="button" color="secondary" outline onClick={onCancel}>Cancelar</Button>
                            <Button type="submit" color="primary">{guardando ? 'Guardando…' : 'Crear sucursal'}</Button>
                        </div>
                    </fieldset>
                </Form>
            </CardBody>
        </Card>
    );
}
