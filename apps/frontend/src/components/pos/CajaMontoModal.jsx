import { useId, useRef, useState } from 'react';
import { Alert, Button, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

export default function CajaMontoModal({ titulo, etiqueta, accion, onCerrar, onConfirmar }) {
    const id = useId();
    const campoMonto = useRef(null);
    const [monto, setMonto] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const cerrar = guardando ? undefined : onCerrar;

    async function confirmar(evento) {
        evento.preventDefault();
        if (guardando) return;
        if (!/^\d{1,8}(\.\d{1,2})?$/.test(monto)) {
            setError('Ingresa un importe en dólares con hasta dos decimales.');
            return;
        }

        setGuardando(true);
        setError('');
        try {
            await onConfirmar(Number(monto));
        } catch (err) {
            setError(err.message || 'No se pudo guardar el movimiento de caja.');
        } finally {
            setGuardando(false);
        }
    }

    return (
        <Modal isOpen toggle={cerrar} backdrop={guardando ? 'static' : true} keyboard={!guardando}
            labelledBy={`${id}-titulo`} onOpened={() => campoMonto.current?.focus()}>
            <ModalHeader id={`${id}-titulo`} toggle={cerrar}>{titulo}</ModalHeader>
            <Form onSubmit={confirmar} aria-busy={guardando}>
                <ModalBody>
                    <FormGroup>
                        <Label for={`${id}-monto`}>{etiqueta}</Label>
                        <Input id={`${id}-monto`} type="number" min="0" max="99999999.99" step="0.01" required
                            innerRef={campoMonto} value={monto} disabled={guardando}
                            onChange={(evento) => setMonto(evento.target.value)} />
                    </FormGroup>
                    {error && <Alert color="danger" role="alert">{error}</Alert>}
                </ModalBody>
                <ModalFooter>
                    <Button type="button" outline color="secondary" disabled={guardando} onClick={onCerrar}>Cancelar</Button>
                    <Button type="submit" color="primary" disabled={guardando}>
                        {guardando ? 'Guardando…' : accion}
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    );
}
