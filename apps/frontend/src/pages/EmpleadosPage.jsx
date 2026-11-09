import { Link } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { useAuth } from "../context/AuthContext.jsx";

export default function EmpleadosPage() {
    const { token } = useAuth();

    return (
        <Container className="py-5 text-center">
            <h1 className="display-6">Empleados</h1>
        </Container>
    );
}
