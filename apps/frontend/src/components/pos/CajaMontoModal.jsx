import { useId, useRef, useState } from 'react';
import { Alert, Button, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';

const formatoImporte = /^\d{1,8}(\.\d{1,2})?$/;
const medios = [
    ['tarjeta_reportada', 'Tarjeta reportada (USD)'],
    ['bitcoin_reportado', 'Bitcoin reportado (USD)'],
];

export default function CajaMontoModal({ titulo, etiqueta, accion, onCerrar, onConfirmar, conciliacion = false }) {
    const id = useId();
    const campoMonto = useRef(null);
    const seccionConciliacion = useRef(null);
    const [monto, setMonto] = useState('');
    const [reportados, setReportados] = useState({ tarjeta_reportada: '', bitcoin_reportado: '' });
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const cerrar = guardando ? undefined : onCerrar;

    async function confirmar(evento) {
        evento.preventDefault();
        if (guardando) return;
        const conciliacionInvalida = Object.values(reportados)
            .some((valor) => valor !== '' && !formatoImporte.test(valor));
        if (!formatoImporte.test(monto) || conciliacionInvalida) {
            if (conciliacionInvalida && seccionConciliacion.current) seccionConciliacion.current.open = true;
            setError('Ingresa un importe en dólares con hasta dos decimales.');
            return;
        }

        setGuardando(true);
        setError('');
        try {
            const importes = Object.fromEntries(
                medios.map(([campo]) => [campo, reportados[campo] === '' ? null : Number(reportados[campo])]),
            );
            await onConfirmar(Number(monto), importes);
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
                    {conciliacion && (
                        <details className="border-top pt-3" ref={seccionConciliacion}
                            onInvalid={() => { seccionConciliacion.current.open = true; }}>
                            <summary className="small fw-semibold">Conciliar tarjeta y Bitcoin (opcional)</summary>
                            <p className="small text-muted mt-2 mb-3">Ingresa los totales del reporte de prueba del turno.</p>
                            <div className="row g-3">
                                {medios.map(([campo, nombre]) => (
                                    <FormGroup key={campo} className="col-12 col-sm-6 mb-0">
                                        <Label for={`${id}-${campo}`}>{nombre}</Label>
                                        <Input id={`${id}-${campo}`} type="number" min="0" max="99999999.99" step="0.01"
                                            value={reportados[campo]} disabled={guardando}
                                            onChange={({ target }) => setReportados({ ...reportados, [campo]: target.value })} />
                                    </FormGroup>
                                ))}
                            </div>
                        </details>
                    )}
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
