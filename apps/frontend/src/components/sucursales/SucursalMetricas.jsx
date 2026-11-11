const dolares = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });

export default function SucursalMetricas({ resumen, detalle = false }) {
    if (!resumen) return <p className="text-muted mt-3">Métricas no disponibles.</p>;

    return (
        <div className="sucursal-metricas">
            <dl className="mb-0">
                <div><dt>Empleados activos asignados</dt><dd>{resumen.empleados_activos}</dd></div>
                <div><dt>Ventas del día</dt><dd>{dolares.format(Number(resumen.ventas_hoy))}</dd></div>
                {detalle && <div><dt>Transacciones del día</dt><dd>{resumen.transacciones_hoy}</dd></div>}
            </dl>
            <p className="small text-muted mb-0 mt-2">Fecha en El Salvador · {resumen.fecha}</p>
        </div>
    );
}
