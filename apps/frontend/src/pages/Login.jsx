import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Card, CardBody, Container, Form, FormGroup, Input, Label } from "reactstrap";
import Feedback from "../components/Common/Feedback.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      await login({ email, password });
      const destination = location.state?.from?.pathname || "/";
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="login-shell d-flex align-items-center py-5">
      <Container>
        <Card className="login-card mx-auto border-0 shadow-sm">
          <CardBody className="p-4 p-md-5">
            <p className="eyebrow mb-2">RESTAURANTE ORIGENES</p>
            <h1 className="h3 mb-2">Iniciar sesion</h1>
            <p className="text-secondary mb-4">Ingresa con tu cuenta de trabajo.</p>
            <Feedback>{error}</Feedback>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label for="email">Correo electronico</Label>
                <Input
                  autoComplete="username"
                  id="email"
                  maxLength={254}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </FormGroup>
              <FormGroup>
                <Label for="password">Contrasena</Label>
                <Input
                  autoComplete="current-password"
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </FormGroup>
              <Button block color="dark" disabled={loading} type="submit">
                {loading ? "Validando..." : "Entrar"}
              </Button>
            </Form>
          </CardBody>
        </Card>
      </Container>
    </main>
  );
}
