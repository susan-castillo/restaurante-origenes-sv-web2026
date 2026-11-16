import { Table } from 'reactstrap';
import { FaTable, FaChevronRight } from 'react-icons/fa';
import Card from '../Common/Card.jsx';
import StatusBadge from '../Common/StatusBadge.jsx';
import { calcularMargen, formatearDolares, formatearMargen } from '../../utils/dashboardFormato.js';

// Badge del margen: verde si es positivo, rojo si es negativo, gris si no hay ventas (null).
function MargenBadge({ margen }) {
    if (margen === null) return <StatusBadge variant="secondary" text="—" />;
    return <StatusBadge variant={margen >= 0 ? 'success' : 'danger'} text={formatearMargen(margen)} />;
}

// onSeleccionar es opcional: solo si viene, las filas se vuelven clickeables.
export default function DetalleSucursales({ sucursales, onSeleccionar }) {
    // reduce recorre el arreglo acumulando una suma por columna. Empieza en 0 en todo.
    const totales = sucursales.reduce(
        (acc, s) => ({
            empleados: acc.empleados + Number(s.empleados_asignados),
            ventasHoy: acc.ventasHoy + Number(s.ventas_del_dia),
            ventas: acc.ventas + Number(s.ventas),
            compras: acc.compras + Number(s.compras),
            rentabilidad: acc.rentabilidad + Number(s.rentabilidad),
        }),
        { empleados: 0, ventasHoy: 0, ventas: 0, compras: 0, rentabilidad: 0 },
    );

    const clickeable = typeof onSeleccionar === 'function';

    return (
        <div className="detalle-sucursales">
            <Card className="detalle-sucursales__card" bodyClassName="detalle-sucursales__cuerpo">
                <div className="detalle-sucursales__encabezado">
                    <h2 className="dashboard-page__subtitulo-card">
                        <FaTable aria-hidden="true" /> Detalle por sucursal
                    </h2>
                    {clickeable && <small className="text-muted">Haz clic en una sucursal para ver su detalle</small>}
                </div>

                <div className="detalle-sucursales__scroll">
                    <Table className="detalle-tabla mb-0">
                        <thead>
                            <tr>
                                <th>Sucursal</th>
                                <th className="text-end">Empleados</th>
                                <th className="text-end">Ventas de hoy</th>
                                <th className="text-end">Ventas totales</th>
                                <th className="text-end">Compras</th>
                                <th className="text-end">Rentabilidad</th>
                                <th className="text-end">Margen</th>
                                {clickeable && <th aria-hidden="true" />}
                            </tr>
                        </thead>
                        <tbody>
                            {sucursales.map((s) => (
                                <tr
                                    key={s.id ?? s.nombre}
                                    className={clickeable ? 'detalle-tabla__fila--clic' : ''}
                                    onClick={clickeable ? () => onSeleccionar(s) : undefined}
                                    onKeyDown={clickeable ? (e) => { if (e.key === 'Enter') onSeleccionar(s); } : undefined}
                                    tabIndex={clickeable ? 0 : undefined}
                                >
                                    <td className="fw-semibold">{s.nombre}</td>
                                    <td className="text-end">{Number(s.empleados_asignados)}</td>
                                    <td className="text-end">{formatearDolares(s.ventas_del_dia)}</td>
                                    <td className="text-end">{formatearDolares(s.ventas)}</td>
                                    <td className="text-end">{formatearDolares(s.compras)}</td>
                                    <td className="text-end">{formatearDolares(s.rentabilidad)}</td>
                                    <td className="text-end"><MargenBadge margen={calcularMargen(s.rentabilidad, s.ventas)} /></td>
                                    {clickeable && <td className="text-end text-muted"><FaChevronRight aria-hidden="true" size={11} /></td>}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td>Totales</td>
                                <td className="text-end">{totales.empleados}</td>
                                <td className="text-end">{formatearDolares(totales.ventasHoy)}</td>
                                <td className="text-end">{formatearDolares(totales.ventas)}</td>
                                <td className="text-end">{formatearDolares(totales.compras)}</td>
                                <td className="text-end">{formatearDolares(totales.rentabilidad)}</td>
                                <td className="text-end"><MargenBadge margen={calcularMargen(totales.rentabilidad, totales.ventas)} /></td>
                                {clickeable && <td />}
                            </tr>
                        </tfoot>
                    </Table>
                </div>
            </Card>
        </div>
    );
}