import { Col, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import Button from '../Common/Button.jsx';
import StatusBadge from '../Common/StatusBadge.jsx';
import { calcularMargen, formatearDolares, formatearMargen } from '../../utils/dashboardFormato.js';

// Ventana con los datos de UNA sucursal (la fila en que se hizo clic).
//   sucursal  -> objeto de la fila, o null si no hay ninguna seleccionada (modal cerrado)
//   onCerrar  -> función que limpia la selección en la página
export default function SucursalDetalleModal({ sucursal, onCerrar }) {
    const navigate = useNavigate();

    // Sin sucursal no hay nada que dibujar.
    if (!sucursal) return null;

    const margen = calcularMargen(sucursal.rentabilidad, sucursal.ventas);

    // Cada dato es un objeto; luego se dibujan con map().
    const datos = [
        { etiqueta: 'Empleados activos', valor: Number(sucursal.empleados_asignados) },
        { etiqueta: 'Ventas de hoy', valor: formatearDolares(sucursal.ventas_del_dia) },
        { etiqueta: 'Ventas totales', valor: formatearDolares(sucursal.ventas) },
        { etiqueta: 'Compras', valor: formatearDolares(sucursal.compras) },
        { etiqueta: 'Rentabilidad', valor: formatearDolares(sucursal.rentabilidad) },
    ];

    // La ficha necesita el id. Si por algo no llegó, el botón no se muestra.
    const puedeVerFicha = sucursal.id !== undefined && sucursal.id !== null;

    const irAFicha = () => {
        onCerrar();
        navigate(`/admin/sucursales/${sucursal.id}`);
    };

    return (
        <Modal isOpen toggle={onCerrar} centered className="detalle-modal">
            <ModalHeader toggle={onCerrar}>{sucursal.nombre}</ModalHeader>
            <ModalBody>
                <Row className="g-3">
                    {datos.map(({ etiqueta, valor }) => (
                        <Col key={etiqueta} xs="6">
                            <div className="detalle-modal__dato">
                                <span>{etiqueta}</span>
                                <strong>{valor}</strong>
                            </div>
                        </Col>
                    ))}
                    <Col xs="6">
                        <div className="detalle-modal__dato">
                            <span>Margen</span>
                            <StatusBadge
                                variant={margen === null ? 'secondary' : margen >= 0 ? 'success' : 'danger'}
                                text={formatearMargen(margen)}
                            />
                        </div>
                    </Col>
                </Row>
            </ModalBody>
            <ModalFooter>
                {puedeVerFicha && <Button onClick={irAFicha}>Ver ficha de la sucursal</Button>}
                <Button variant="outline-secondary" onClick={onCerrar}>Cerrar</Button>
            </ModalFooter>
        </Modal>
    );
}