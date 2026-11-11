import { Button, Card, CardBody, CardTitle } from 'reactstrap';
import { MapPin, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import SucursalMetricas from './SucursalMetricas.jsx';

export default function SucursalCard({ sucursal, puedeGestionar }) {
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
                <SucursalMetricas resumen={sucursal.resumen} />
                <div className="sucursal-card__acciones d-flex flex-wrap gap-2">
                    <Button tag={Link} to={`/admin/sucursales/${sucursal.id}`} color="primary" outline
                        aria-label={`Ver sede: ${sucursal.nombre}`}>
                        Ver sede
                    </Button>
                    {puedeGestionar && (
                        <>
                            <Button tag={Link} to={`/admin/sucursales/${sucursal.id}?editar=1`} color="link"
                                aria-label={`Editar sede: ${sucursal.nombre}`}>
                                Editar
                            </Button>
                            <Button tag={Link} to={`/admin/sucursales/${sucursal.id}?estado=1`}
                                color={sucursal.activa ? 'danger' : 'primary'} outline
                                aria-label={`${sucursal.activa ? 'Desactivar' : 'Activar'} sede: ${sucursal.nombre}`}>
                                {sucursal.activa ? 'Desactivar' : 'Activar'}
                            </Button>
                        </>
                    )}
                </div>
            </CardBody>
        </Card>
    );
}
