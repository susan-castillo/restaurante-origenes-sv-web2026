import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Alert, Button, Card, CardBody, Container, Form, FormGroup,
  Input, InputGroup, InputGroupText, Label,
} from 'reactstrap';
import { FaEnvelope, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext.jsx';
import { rutaInicial } from '../config/navegacion.js';
import logoOrigenes from '../assets/panacota-sinbg.png';

const IMAGENES_FONDO = [
  'https://cdn.shopify.com/s/files/1/2964/0212/files/42_b0706929-b3f8-4f6c-bfe9-53a36b1df554_480x480.png?v=1720472518',
  'https://st2.depositphotos.com/1008041/8030/i/450/depositphotos_80304176-stock-photo-fresh-pastel-colored-macarons.jpg',
  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=1200',
  'https://cdn-pro.elsalvador.com/wp-content/uploads/2018/12/postre5.jpg',
];

export default function Login() {
  // --- Estado del formulario ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [indexImagen, setIndexImagen] = useState(0);

  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const ubicacion = useLocation();

  // Si ProtectedRoute nos mandó aquí, "desde" trae la página que el usuario quería abrir.
  const desde = ubicacion.state?.desde?.pathname;

  // --- Cambio de fondo cada 5 segundos ---
  useEffect(() => {
    // Quien pidió "reducir movimiento" en su sistema no ve el cambio automático.
    const reducirMovimiento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducirMovimiento) return;

    const intervalo = setInterval(() => {
      setIndexImagen((anterior) => (anterior + 1) % IMAGENES_FONDO.length);
    }, 5000);

    return () => clearInterval(intervalo); // se limpia al salir de la pantalla
  }, []);

  // Con sesión iniciada no tiene sentido ver el login.
  // (Va DESPUÉS de los hooks: React exige llamar los hooks siempre en el mismo orden.)
  if (usuario) {
    return <Navigate replace to={desde || rutaInicial(usuario)} />;
  }

  // --- Enviar el formulario ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // evita que el navegador recargue la página
    setError('');
    setCargando(true);

    try {
      const user = await login(email, password); // devuelve el usuario
      navigate(desde || rutaInicial(user), { replace: true });
    } catch (err) {
      // El mensaje viene del backend ("Correo o contraseña incorrectos") o de api.js
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setCargando(false); // siempre reactivamos el botón
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

        {/* 2. Capa oscura para que el texto se lea sobre cualquier foto */}
        <div className="bg-overlay" />

        {/* 3. Contenido */}
        <Container className="login-content d-flex justify-content-center align-items-center flex-grow-1">
          <Card style={{ maxWidth: '480px', width: '100%' }} className="card-patisserie shadow-lg">
            <CardBody className="p-4 p-md-5">
              <div className="text-center mb-0">
                {/* Solo width: con height fijo también, la imagen se estira */}
                <img
                    src={logoOrigenes}
                    alt="Postre Orígenes"
                    style={{ width: '200px', height: 'auto' }}
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
                  <Alert role="alert" className="bg-danger text-light py-2 small text-center">
                    {error}
                  </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Correo electrónico */}
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
                        autoComplete="username" /* el gestor de contraseñas del navegador lo reconoce */
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <InputGroupText className="bg-transparent border-light">
                      <FaEnvelope color="#FFF" size={18} />
                    </InputGroupText>
                  </InputGroup>
                </FormGroup>

                {/* Contraseña con ojo para verla u ocultarla */}
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
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <InputGroupText className="bg-transparent border-light p-0">
                      {/* Es un botón de verdad: se puede usar con Tab y Enter */}
                      <button
                          type="button"
                          onClick={() => setMostrarPassword(!mostrarPassword)}
                          aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          aria-pressed={mostrarPassword}
                          style={{ background: 'none', border: 0, padding: '0 .75rem', height: '100%', display: 'flex', alignItems: 'center' }}
                      >
                        {mostrarPassword ? <FaEyeSlash color="#FFF" size={18} /> : <FaEye color="#FFF" size={18} />}
                      </button>
                    </InputGroupText>
                  </InputGroup>
                </FormGroup>

                {/* Botón principal */}
                <Button
                    block
                    type="submit"
                    className="w-100 py-3 mt-5 text-light rounded-4 fw-bold shadow bg-pinky-degrade"
                    disabled={cargando}
                >
                  {cargando ? 'Accediendo al sistema...' : 'Iniciar sesión'}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Container>
      </div>
  );
}
