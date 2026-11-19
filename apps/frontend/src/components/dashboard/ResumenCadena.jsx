import { FaShoppingBag, FaTrophy } from 'react-icons/fa';
import Card from '../Common/Card.jsx';
import { formatearDolares } from '../../utils/dashboardFormato.js';

// Dos datos destacados. "mejor" es la sucursal con más rentabilidad EN DÓLARES (no en porcentaje).
export default function ResumenCadena({ ventasHoy, mejor }) {
    return (
        <Card className="resumen-cadena" bodyClassName="resumen-cadena__cuerpo">
            <div className="resumen-cadena__dato resumen-cadena__dato--cielo">
                <FaShoppingBag aria-hidden="true" />
                <div>
                    <span>Ventas de hoy de toda la cadena</span>
                    <strong>{formatearDolares(ventasHoy)}</strong>
                </div>
            </div>
            {mejor && (
                <div className="resumen-cadena__dato resumen-cadena__dato--naranja">
                    <FaTrophy aria-hidden="true" />
                    <div>
                        <span>Mayor rentabilidad (USD)</span>
                        <strong>{mejor.nombre} · {formatearDolares(mejor.rentabilidad)}</strong>
                    </div>
                </div>
            )}
        </Card>
    );
}