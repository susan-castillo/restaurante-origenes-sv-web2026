import { Modal, ModalBody, Progress } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { FaStore } from 'react-icons/fa';
import Button from '../Common/Button.jsx';
import { calcularMargen, formatearDolares, formatearMargen } from '../../utils/dashboardFormato.js';

// Ventana con los datos de UNA sucursal (la fila en que se hizo clic).
//   sucursal  -> objeto de la fila, o null si no hay ninguna seleccionada (modal cerrado)
//   onCerrar  -> función que limpia la selección en la página
export default function SucursalDetalleModal({ sucursal, onCerrar }) {
    const navigate = useNavigate();

    // Sin sucursal no hay nada que dibujar.
    if (!sucursal) return null;

    const margen = calcularMargen(sucursal.rentabilidad, sucursal.ventas);
    // La barra va de 0 a 100: un margen negativo o inexistente se dibuja vacío.
    const margenBarra = margen === null ? 0 : Math.min(100, Math.max(0, margen));

    // Cada dato es un objeto; luego se dibujan con map(). "tono" elige el color de la caja.
    const datos = [
        { etiqueta: 'Empleados activos', valor: Number(sucursal.empleados_asignados), tono: 'cielo' },
        { etiqueta: 'Ventas de hoy', valor: formatearDolares(sucursal.ventas_del_dia), tono: 'rosa' },
        { etiqueta: 'Ventas totales', valor: formatearDolares(sucursal.ventas), tono: 'durazno' },
        { etiqueta: 'Compras', valor: formatearDolares(sucursal.compras), tono: 'naranja' },
        { etiqueta: 'Rentabilidad', valor: formatearDolares(sucursal.rentabilidad), tono: 'verde' },
        { etiqueta: 'Margen', valor: formatearMargen(margen), tono: 'morado', negativo: margen !== null && margen < 0 },
    ];

    // La ficha necesita el id. Si por algo no llegó, el botón no se muestra.
    const puedeVerFicha = sucursal.id !== undefined && sucursal.id !== null;

    const irAFicha = () => {
        onCerrar();
        navigate(`/admin/sucursales/${sucursal.id}`);
    };

    return (
        <Modal isOpen toggle={onCerrar} centered className="detalle-modal"
               contentClassName="detalle-modal__contenido" labelledBy="detalle-modal-titulo">
            <ModalBody>
                <div className="detalle-modal__cabecera">
                    <div className="detalle-modal__icono" aria-hidden="true"><FaStore /></div>
                    <div className="detalle-modal__titulo-bloque">
                        <h2 id="detalle-modal-titulo" className="detalle-modal__titulo">{sucursal.nombre}</h2>
                        <Progress value={margenBarra} className="detalle-modal__barra"
                                  barClassName="detalle-modal__barra-relleno"
                                  aria-label={`Margen de ${sucursal.nombre}`} />
                    </div>
                </div>

                <div className="detalle-modal__rejilla">
                    {datos.map(({ etiqueta, valor, tono, negativo }) => (
                        <div key={etiqueta}
                             className={`detalle-modal__dato detalle-modal__dato--${tono} ${negativo ? 'detalle-modal__dato--negativo' : ''}`}>
                            <span>{etiqueta}</span>
                            <strong>{valor}</strong>
                        </div>
                    ))}
                </div>

                <div className="detalle-modal__pie">
                    {puedeVerFicha && (
                        <Button className="detalle-modal__boton detalle-modal__boton--principal" onClick={irAFicha}>
                            Ver ficha de la sucursal
                        </Button>
                    )}
                    <Button variant="light" className="detalle-modal__boton detalle-modal__boton--secundario" onClick={onCerrar}>
                        Cerrar
                    </Button>
                </div>
            </ModalBody>
        </Modal>
    );
}