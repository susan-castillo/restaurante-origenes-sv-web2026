import Card from '../Common/Card.jsx';

// Tarjeta de un indicador. Es "tonta": solo dibuja lo que le pasan por props.
//   icono   -> componente de react-icons (se renderiza como <Icono />)
//   tono    -> color del ícono: 'cielo' | 'rosa' | 'naranja' | 'verde'
//   extra   -> si viene, reemplaza al texto auxiliar (lo usamos para el badge de margen)
export default function KpiCard({ icono: Icono, etiqueta, valor, auxiliar, tono = 'cielo', valorClase = '', extra = null }) {
    return (
        <Card className="kpi-card" bodyClassName="d-flex align-items-center gap-3">
            <div className={`kpi-card__icono kpi-card__icono--${tono}`}>
                <Icono aria-hidden="true" />
            </div>
            <div className="kpi-card__texto">
                <span className="kpi-card__etiqueta">{etiqueta}</span>
                <strong className={`kpi-card__valor ${valorClase}`}>{valor}</strong>
                {extra ?? <span className="kpi-card__auxiliar">{auxiliar}</span>}
            </div>
        </Card>
    );
}