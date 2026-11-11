import 'dotenv/config';
import app from './app.js';

// Asignación de puerto y host desde variables de entorno o valores por defecto
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';

// Validación del rango de puerto válido para el sistema operativo
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('El puerto debe ser un número entero entre 1 y 65535.');
}

// Inicialización del servidor de Express
app.listen(port, host, () => {
  console.log(`API disponible en http://${host}:${port}`);
});