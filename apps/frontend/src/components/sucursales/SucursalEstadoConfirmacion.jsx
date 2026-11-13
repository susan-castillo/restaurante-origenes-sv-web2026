import Button from '../Common/Button.jsx';
import Card from '../Common/Card.jsx';
import { useEffect, useRef, useState } from 'react';
import { Alert, CardTitle } from 'reactstrap';
import { actualizarSucursal } from '../../services/sucursales.js';

export default function SucursalEstadoConfirmacion({ sucursal, onCancel, onSaved }) {
    const vigente = useRef(false);
    const cancelar = useRef(null);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const activa = !sucursal.activa;
    const accion = activa ? 'Activar' : 'Desactivar';

    useEffect(() => {
        vigente.current = true;
        cancelar.current?.focus();
        return () => { vigente.current = false; };
    }, []);

    async function confirmar() {
        if (guardando) return;
        setGuardando(true);
        setError('');
        try {
            const respuesta = await actualizarSucursal(sucursal.id, { activa });
            if (vigente.current) onSaved(respuesta.sucursal);
        } catch (err) {
            if (vigente.current) setError(err.message || 'No se pudo cambiar el estado de la sede.');
        } finally {
            if (vigente.current) setGuardando(false);
        }
    }

    return (
        <Card tag="section" className="sucursal-card" aria-labelledby="confirmar-estado-titulo" aria-busy={guardando}>
            <CardTitle tag="h2" id="confirmar-estado-titulo">¿{accion} {sucursal.nombre}?</CardTitle>
            <p>{activa
                ? 'La sede volverá a aparecer en el selector de sucursales activas.'
                : 'La sede dejará de aparecer en el selector de sucursales activas.'}</p>
            {!activa && <Alert color="warning">Los registros históricos de la sede se conservarán.</Alert>}
            {error && <Alert color="danger" role="alert">{error}</Alert>}
            <div className="d-flex flex-wrap gap-2">
                <Button type="button" variant="outline-secondary" ref={cancelar} disabled={guardando} onClick={onCancel}>
                    Cancelar
                </Button>
                <Button type="button" variant={activa ? 'secondary' : 'danger'} disabled={guardando} onClick={confirmar}>
                    {guardando ? 'Guardando…' : `Confirmar ${activa ? 'activación' : 'desactivación'}`}
                </Button>
            </div>
        </Card>
    );
}
