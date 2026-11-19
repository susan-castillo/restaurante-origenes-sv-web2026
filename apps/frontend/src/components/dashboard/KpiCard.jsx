import Card from '../Common/Card.jsx';

// Tarjeta de un indicador. Es "tonta": solo dibuja lo que le pasan por props.
//   icono          -> componente de react-icons (se renderiza como <Icono />)
//   tono           -> color de la tarjeta: 'cielo' | 'rosa' | 'naranja' | 'verde'
//   auxiliarClase  -> clase extra para el texto auxiliar (ej. verde o rojo en el margen)
export default function KpiCard({ icono: Icono, etiqueta, valor, auxiliar, tono = 'cielo', auxiliarClase = '' }) {
    return (
        <Card className={`kpi-card kpi-card--${tono}`}>
            <div className="kpi-card__cabecera">
                <Icono className="kpi-card__icono" aria-hidden="true" />
                <span className="kpi-card__etiqueta">{etiqueta}</span>
            </div>
            <strong className="kpi-card__valor">{valor}</strong>
            <span className={`kpi-card__auxiliar ${auxiliarClase}`}>{auxiliar}</span>
        </Card>
    );
}