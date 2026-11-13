import Button from '../Common/Button.jsx';
import Card from '../Common/Card.jsx';
import { useEffect, useId, useRef, useState } from 'react';
import { Alert, CardTitle, Col, Form, FormGroup, Input, Label, Row } from 'reactstrap';
import { actualizarSucursal, crearSucursal } from '../../services/sucursales.js';

export default function SucursalForm({ sucursal, onCancel, onSaved }) {
    const formId = useId();
    const editando = Boolean(sucursal);
    const campoNombre = useRef(null);
    const vigente = useRef(false);
    const [nombre, setNombre] = useState(sucursal?.nombre ?? '');
    const [direccion, setDireccion] = useState(sucursal?.direccion ?? '');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        vigente.current = true;
        campoNombre.current?.focus();
        return () => { vigente.current = false; };
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

        const cambios = {};
        if (editando) {
            if (nombreLimpio !== sucursal.nombre) cambios.nombre = nombreLimpio;
            if (direccionLimpia !== sucursal.direccion) cambios.direccion = direccionLimpia;
            if (Object.keys(cambios).length === 0) {
                onCancel();
                return;
            }
        }

        setGuardando(true);
        setError('');
        try {
            const respuesta = editando
                ? await actualizarSucursal(sucursal.id, cambios)
                : await crearSucursal(nombreLimpio, direccionLimpia);
            if (vigente.current) onSaved(respuesta.sucursal);
        } catch (err) {
            if (vigente.current) setError(err.message || 'No se pudo guardar la sucursal.');
        } finally {
            if (vigente.current) setGuardando(false);
        }
    }

    return (
        <Card tag="section" className={`sucursal-card ${editando ? 'sucursales-page__detalle' : 'mt-4'}`} aria-labelledby={`${formId}-titulo`}>
            <CardTitle tag="h2" id={`${formId}-titulo`}>{editando ? 'Editar información de la sede' : 'Nueva sucursal'}</CardTitle>
            <Form onSubmit={guardar} aria-busy={guardando}>
                {error && <Alert color="danger" role="alert">{error}</Alert>}
                <fieldset disabled={guardando}>
                    <Row className="g-3">
                        <Col md={editando ? 12 : 5}>
                            <FormGroup>
                                <Label for={`${formId}-nombre`}>Nombre</Label>
                                <Input id={`${formId}-nombre`} innerRef={campoNombre} required
                                    maxLength={100} value={nombre} onChange={(event) => setNombre(event.target.value)} />
                            </FormGroup>
                        </Col>
                        <Col md={editando ? 12 : 5}>
                            <FormGroup>
                                <Label for={`${formId}-direccion`}>Dirección</Label>
                                <Input id={`${formId}-direccion`} required maxLength={200}
                                    value={direccion} onChange={(event) => setDireccion(event.target.value)} />
                            </FormGroup>
                        </Col>
                        <Col md={editando ? 12 : 2}>
                            <FormGroup>
                                <Label for={`${formId}-estado`}>{editando ? 'Estado actual' : 'Estado inicial'}</Label>
                                <Input id={`${formId}-estado`} value={sucursal?.activa === false ? 'Inactiva' : 'Activa'} readOnly />
                            </FormGroup>
                        </Col>
                    </Row>
                    <div className="d-flex flex-wrap justify-content-end gap-2">
                        <Button type="button" variant="outline-secondary" onClick={onCancel}>Cancelar</Button>
                        <Button type="submit" variant="secondary">
                            {guardando ? 'Guardando…' : editando ? 'Guardar sede' : 'Crear sucursal'}
                        </Button>
                    </div>
                </fieldset>
            </Form>
        </Card>
    );
}
