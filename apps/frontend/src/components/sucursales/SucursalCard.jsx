import { Button, Card, CardBody, CardTitle } from 'reactstrap';
import { MapPin, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SucursalCard({ sucursal }) {
    return (
        <Card tag="article" className="sucursal-card">
            <CardBody>
                <CardTitle tag="h2">{sucursal.nombre}</CardTitle>
                <div className="sucursal-card__estado">
                    <Store size={26} aria-hidden="true" />
                    <span className={`sucursal-card__badge${sucursal.activa ? '' : ' sucursal-card__badge--inactiva'}`}>
                        {sucursal.activa ? 'Activa' : 'Inactiva'}
                    </span>
                </div>
                <p className="sucursal-card__direccion">
                    <MapPin size={17} aria-hidden="true" />
                    {sucursal.direccion || 'Dirección no registrada'}
                </p>
                <div className="sucursal-card__acciones d-flex flex-wrap gap-2">
                    <Button tag={Link} to={`/admin/sucursales/${sucursal.id}`} color="primary" outline
                        aria-label={`Ver sede: ${sucursal.nombre}`}>
                        Ver sede
                    </Button>
                    <Button tag={Link} to={`/admin/sucursales/${sucursal.id}?editar=1`} color="link"
                        aria-label={`Editar sede: ${sucursal.nombre}`}>
                        Editar
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
}
