import { Card, CardBody, CardTitle } from 'reactstrap';
import { MapPin, Store } from 'lucide-react';

export default function SucursalCard({ sucursal }) {
    return (
        <Card tag="article" className="sucursal-card">
            <CardBody>
                <CardTitle tag="h2">{sucursal.nombre}</CardTitle>
                <div className="sucursal-card__estado">
                    <Store size={26} aria-hidden="true" />
                    {/* El endpoint actual consulta exclusivamente sedes activas. */}
                    <span className="sucursal-card__badge">Activa</span>
                </div>
                <p className="sucursal-card__direccion">
                    <MapPin size={17} aria-hidden="true" />
                    {sucursal.direccion || 'Dirección no registrada'}
                </p>
            </CardBody>
        </Card>
    );
}
