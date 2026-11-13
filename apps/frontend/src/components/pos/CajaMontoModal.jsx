import Feedback from "../Common/Feedback.jsx";
import Modal from '../Common/Modal.jsx';
import Button from '../Common/Button.jsx';
import { useId, useRef, useState } from 'react';
import { Form, FormGroup, Input, Label } from 'reactstrap';

const formatoImporte = /^\d{1,8}(\.\d{1,2})?$/;
const medios = [
    ['tarjeta_reportada', 'Tarjeta reportada (USD)'],
    ['bitcoin_reportado', 'Bitcoin reportado (USD)'],
];

export default function CajaMontoModal({ titulo, etiqueta, accion, onCerrar, onConfirmar, conciliacion = false }) {
    const id = useId();
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
        <Modal show title={titulo} onClose={cerrar} footer={
            <>
                <Button variant="outline-secondary" disabled={guardando} onClick={onCerrar}>Cancelar</Button>
                <Button type="submit" form={`${id}-form`} variant="secondary" disabled={guardando}>
                    {guardando ? 'Guardando…' : accion}
                </Button>
            </>
        }>
            <Form id={`${id}-form`} onSubmit={confirmar} aria-busy={guardando}>
                    <FormGroup>
                        <Label for={`${id}-monto`}>{etiqueta}</Label>
                        <Input id={`${id}-monto`} type="number" min="0" max="99999999.99" step="0.01" required
                            autoFocus value={monto} disabled={guardando}
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
                    <Feedback>{error}</Feedback>
            </Form>
        </Modal>
    );
}