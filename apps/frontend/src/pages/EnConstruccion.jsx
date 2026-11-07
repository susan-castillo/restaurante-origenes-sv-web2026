// Pantalla provisional para los módulos que aún no existen (POS, Compras, Caja, RRHH).
// Cada pareja de desarrollo la reemplaza por su página real en App.jsx.
// Mientras tanto el Sidebar funciona completo y nadie cae en un 404.
export default function EnConstruccionPage({ titulo, responsable }) {
    return (
        <div className="text-center py-5">
            <h2 className="mb-2">{titulo}</h2>
            <p className="text-secondary mb-0">
                Este módulo todavía está en construcción{responsable ? ` (${responsable})` : ''}.
            </p>
        </div>
    );
}
