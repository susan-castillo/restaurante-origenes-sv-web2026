import { Link } from "react-router-dom";
import { Button, Container } from "reactstrap";
import { useAuth } from "../context/AuthContext.jsx";

export default function NotFound() {
  const { token } = useAuth();

  return (
    <Container className="py-5 text-center">
      <p className="eyebrow">ERROR 404</p>
      <h1 className="display-6">Pagina no encontrada</h1>
      <p className="text-secondary">La direccion solicitada no existe.</p>
      <Button color="dark" tag={Link} to={token ? "/" : "/login"}>
        Volver
      </Button>
    </Container>
  );
}
