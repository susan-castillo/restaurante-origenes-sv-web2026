import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert, Row, Col } from 'reactstrap';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      const response = await login(email, password);
      const user = response?.usuario || response;

      if (!user) {
        throw new Error('No se obtuvo respuesta del usuario.');
      }

      if (user.rol === 'ADMIN' || user.cargo === 'GERENTE') {
        navigate('/admin/caja');
      } else {
        navigate('/pos');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setCargando(false);
    }
  };

  return (
      <div className="login-bg d-flex flex-column justify-content-between align-items-center py-4">
        {/* Tarjeta Central del Formulario */}
        <Container className="d-flex justify-content-center align-items-center flex-grow-1">
          <Card style={{ maxWidth: '440px', width: '100%' }} className="card-patisserie shadow-lg">
            <CardBody className="p-4 p-md-5">
              {/* Logo o Icono Decorativo */}
              <div className="text-center mb-4">
                <h2 className="text-cream fw-serif mb-2">Bienvenido a Orígenes</h2>
                <p className={"text-light fw-light"}>Inicia sesión para abrir caja, tomar pedidos, o administrar tu sucursal</p>
              </div>

              {error && (
                  <Alert color="danger" className="bg-dark text-pinky border-pinky opacity-90 py-2 small">
                    {error}
                  </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <FormGroup className="mb-3">
                  <Label for="email" className="text-cream small letter-spacing-1">
                    Correo eléctronico
                  </Label>
                  <Input
                      type="email"
                      id="email"
                      className="input-patisserie py-2"
                      placeholder="admin@origenes.sv"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                  />
                </FormGroup>

                <FormGroup className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <Label for="password" className="text-cream small letter-spacing-1">
                      Contraseña
                    </Label>
                  </div>
                  <Input
                      type="password"
                      id="password"
                      className="input-patisserie py-2"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                  />
                </FormGroup>
                <div className={"text-end"}>
                  <a href="#reset" className="text-secondary text-decoration-none small opacity-75">
                    ¿Olvidaste la clave?
                  </a>
                </div>

                {/* Botón Principal (Dorado/Terracota) */}
                <Button
                    color="pinky"
                    block
                    className="w-100 py-2 mt-4 text-cream fw-bold text-uppercase shadow-md"
                    disabled={cargando}
                >
                  {cargando ? 'Accediendo al Salón...' : 'Iniciar sesión'}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Container>

        {/* Pie de página */}
        <footer className="text-center text-cream opacity-50 small mt-4">
          <p className="mb-0">© 2026 Restaurante Orígenes SV — Arte en Cafetería & Postres</p>
        </footer>
      </div>
  );
}