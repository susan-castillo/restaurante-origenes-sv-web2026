import { useRef, useState } from 'react';
import { Alert, Button, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { abrirCaja } from '../../services/cajasService.js';

export default function AperturaCajaModal({ onCerrar, onAbrir }) {
    const campoMonto = useRef(null);
    const [monto, setMonto] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const cerrar = guardando ? undefined : onCerrar;

    async function confirmar(evento) {
        evento.preventDefault();
        if (guardando) return;
        if (!/^\d{1,8}(\.\d{1,2})?$/.test(monto)) {
            setError('Ingresa el fondo inicial en dólares con hasta dos decimales.');
            return;
        }

        setGuardando(true);
        setError('');
        try {
            const { turno } = await abrirCaja(Number(monto));
            onAbrir(turno);
        } catch (err) {
            setError(err.message || 'No se pudo abrir la caja.');
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Modal isOpen toggle={cerrar} backdrop={guardando ? 'static' : true} keyboard={!guardando}
            labelledBy="abrir-caja-titulo" onOpened={() => campoMonto.current?.focus()}>
            <ModalHeader id="abrir-caja-titulo" toggle={cerrar}>Abrir caja</ModalHeader>
            <Form onSubmit={confirmar} aria-busy={guardando}>
                <ModalBody>
                    <FormGroup>
                        <Label for="caja-monto-inicial">Fondo inicial (USD)</Label>
                        <Input id="caja-monto-inicial" type="number" min="0" max="99999999.99" step="0.01" required
                            innerRef={campoMonto} value={monto} disabled={guardando}
                            onChange={(evento) => setMonto(evento.target.value)} />
                    </FormGroup>
                    {error && <Alert color="danger" role="alert">{error}</Alert>}
                </ModalBody>
                <ModalFooter>
                    <Button type="button" outline color="secondary" disabled={guardando} onClick={onCerrar}>Cancelar</Button>
                    <Button type="submit" color="primary" disabled={guardando}>
                        {guardando ? 'Abriendo…' : 'Confirmar apertura'}
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    );
}
