import { Link } from 'react-router-dom';

// Se muestra cuando alguien con sesión intenta abrir una pantalla que su rol no permite.
export default function NoAutorizadoPage() {
    return (
        <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 text-center">
            <h2>Sin permiso</h2>
            <p className="text-secondary">Tu rol no tiene acceso a esta sección.</p>
            {/* "/" redirige a la pantalla principal de su rol */}
            <Link to="/">Volver al inicio</Link>
        </div>
    );
}
