import { Progress } from 'reactstrap';
import { FaChartBar } from 'react-icons/fa';
import Card from '../Common/Card.jsx';
import { formatearDolares } from '../../utils/dashboardFormato.js';

// Qué porcentaje de la barra llena un valor, comparado con el máximo de todas las sucursales.
// Si el máximo es 0 (sin datos) devuelve 0 para no dividir entre cero.
const porcentaje = (valor, maximo) => (maximo > 0 ? (valor / maximo) * 100 : 0);

export default function RendimientoSucursales({ sucursales }) {
    // flatMap convierte cada sucursal en [ventas, compras] y aplana todo en un solo arreglo.
    // Math.max con ese arreglo da el valor más grande: contra él se escalan TODAS las barras.
    const maximo = Math.max(0, ...sucursales.flatMap((s) => [Number(s.ventas), Number(s.compras)]));

    return (
        <Card className="rendimiento-card">
            <div className="rendimiento-card__encabezado">
                <h2 className="dashboard-page__subtitulo-card">
                    <FaChartBar aria-hidden="true" /> Rendimiento por sucursal
                </h2>
                <div className="rendimiento-card__leyenda">
                    <span><i className="leyenda-punto leyenda-punto--ventas" /> Ventas</span>
                    <span><i className="leyenda-punto leyenda-punto--compras" /> Compras</span>
                </div>
            </div>

            {sucursales.map((s) => {
                const ventas = Number(s.ventas);
                const compras = Number(s.compras);
                return (
                    <div key={s.id ?? s.nombre} className="rendimiento-fila">
                        <span className="rendimiento-fila__nombre">{s.nombre}</span>
                        <div className="rendimiento-fila__barras">
                            <div className="rendimiento-fila__linea">
                                <Progress value={porcentaje(ventas, maximo)} className="rendimiento-barra"
                                          barClassName="rendimiento-barra--ventas" aria-label={`Ventas de ${s.nombre}`} />
                                <span>{formatearDolares(ventas)}</span>
                            </div>
                            <div className="rendimiento-fila__linea">
                                <Progress value={porcentaje(compras, maximo)} className="rendimiento-barra"
                                          barClassName="rendimiento-barra--compras" aria-label={`Compras de ${s.nombre}`} />
                                <span>{formatearDolares(compras)}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </Card>
    );
}