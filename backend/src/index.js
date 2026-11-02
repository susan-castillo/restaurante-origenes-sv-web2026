const express = require('express');
const cors = require('cors');
//Nos permite leer las variables que vienen del archivo .env (Por seguridad para no dejar dichas variables expuestas en el repo)
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/api', (req, res) => {
    res.json({ status: 'OK', message: 'Servidor Backend corriendo correctamente' });
});

//Lee el puerto desde el archivo .env
const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});