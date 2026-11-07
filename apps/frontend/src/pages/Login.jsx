import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardBody,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Alert,
  InputGroupText,
  InputGroup
} from 'reactstrap';
import { useAuth } from '../context/AuthContext.jsx';
import logoOrigenes from '../assets/panacota-sinbg.png';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

// Arreglo de imágenes para el fondo con temática de cafetería/repostería
const IMAGENES_FONDO = [
  'https://cdn.shopify.com/s/files/1/2964/0212/files/42_b0706929-b3f8-4f6c-bfe9-53a36b1df554_480x480.png?v=1720472518',
  'https://st2.depositphotos.com/1008041/8030/i/450/depositphotos_80304176-stock-photo-fresh-pastel-colored-macarons.jpg',
  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=1200',
  'https://cdn-pro.elsalvador.com/wp-content/uploads/2018/12/postre5.jpg'
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [indexImagen, setIndexImagen] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Transición suave de imágenes cada 5 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      setIndexImagen((prevIndex) => (prevIndex + 1) % IMAGENES_FONDO.length);
    }, 5000);

    return () => clearInterval(intervalo);
  }, []);

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
      <div className="login-container position-relative min-vh-100 overflow-hidden d-flex flex-column justify-content-between align-items-center py-4">
        {/* 1. Capas superpuestas para la transición de imágenes */}
        {IMAGENES_FONDO.map((imgUrl, i) => (
            <div
                key={imgUrl}
                className={`bg-slide ${i === indexImagen ? 'active' : ''}`}
                style={{ backgroundImage: `url(${imgUrl})` }}
            />
        ))}

        {/* 2. Capa oscura/filtro para contraste con la paleta de la marca */}
        <div className="bg-overlay" />

        {/* 3. Contenido de la interfaz */}
        <Container className="login-content d-flex justify-content-center align-items-center flex-grow-1">
          <Card style={{ maxWidth: '480px', width: '100%' }} className="card-patisserie shadow-lg">
            <CardBody className="p-4 p-md-5">
              <div className="text-center mb-0">
                <img
                    src={logoOrigenes}
                    alt="Postre Orígenes"
                    style={{ width: '200px', height: '130px' }}
                    className="img-fluid logo-glow"
                />
              </div>

              <div className="text-center mb-4">
                <h2 className="text-cream fw-bold mb-2 font-origenes">Bienvenido a Orígenes</h2>
                <p className="text-cream font-origenes fw-lighter">
                  Inicia sesión para abrir caja, tomar pedidos, o administrar tu sucursal
                </p>
              </div>

              {error && (
                  <Alert className="bg-red text-light border-pinky opacity-90 py-2 small text-center">
                    {error}
                  </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Correo Electrónico */}
                <FormGroup className="mb-3">
                  <Label for="email" className="text-cream fw-semibold small letter-spacing-1">
                    Correo electrónico
                  </Label>
                  <InputGroup>
                    <Input
                        type="email"
                        id="email"
                        className="input-patisserie py-2"
                        placeholder="admin@origenes.sv"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <InputGroupText className="bg-transparent border-light">
                      <FaEnvelope color="#FFF" size={18} />
                    </InputGroupText>
                  </InputGroup>
                </FormGroup>

                {/* Contraseña con toggle de ver/ocultar */}
                <FormGroup className="mb-3">
                  <Label for="password" className="text-cream fw-semibold small letter-spacing-1">
                    Contraseña
                  </Label>
                  <InputGroup>
                    <Input
                        type={mostrarPassword ? 'text' : 'password'}
                        id="password"
                        className="input-patisserie py-2"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <InputGroupText
                        className="bg-transparent border-light"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setMostrarPassword(!mostrarPassword)}
                    >
                      {mostrarPassword ? (
                          <FaEyeSlash color="#FFF" size={18} />
                      ) : (
                          <FaEye color="#FFF" size={18} />
                      )}
                    </InputGroupText>
                  </InputGroup>
                </FormGroup>

                {/* Botón Principal */}
                <Button
                    block
                    type="submit"
                    className="w-100 py-3 mt-5 text-light rounded-4 fw-bold shadow-md bg-pinky-degrade"
                    disabled={cargando}
                >
                  {cargando ? 'Accediendo al Salón...' : 'Iniciar sesión'}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Container>
      </div>
  );
}