import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, CardBody, Form, FormGroup, Label, Input, Button, Alert } from 'reactstrap';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

      // Programación defensiva: verificar que la respuesta devuelta por login() exista
      const user = response?.usuario || response;

      if (!user) {
        throw new Error('No se obtuvo respuesta del usuario.');
      }

      // Redirección por Rol / Cargo
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
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Card style={{ width: '400px' }} className="shadow">
          <CardBody className="p-4">
            <h3 className="text-center mb-4">Restaurante Orígenes</h3>

            {error && <Alert color="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label for="email">Correo Electrónico</Label>
                <Input
                    type="email"
                    id="email"
                    placeholder="usuario@origenes.sv"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
              </FormGroup>

              <FormGroup className="mt-3">
                <Label for="password">Contraseña</Label>
                <Input
                    type="password"
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
              </FormGroup>

              <Button color="secondary" block className="w-100 mt-4" disabled={cargando}>
                {cargando ? 'Iniciando sesión...' : 'Ingresar'}
              </Button>
            </Form>
          </CardBody>
        </Card>
      </Container>
  );
}