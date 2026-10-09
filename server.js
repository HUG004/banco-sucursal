const express = require('express');
const path = require('path');

const clientesRoutes = require('./src/routes/clientesRoutes');
const transaccionesRoutes = require('./src/routes/transaccionesRoutes');
const reportesRoutes = require('./src/routes/reportesRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta de salud
app.get('/api/salud', (req, res) => {
    res.status(200).json({
        estado: 'OK',
        servicio: 'Nodo 2 - Sucursal Bancaria',
        mensaje: 'Servidor funcionando correctamente'
    });
});

// Rutas de clientes
app.use('/api/clientes', clientesRoutes);

// Rutas de transacciones
app.use('/api/transacciones', transaccionesRoutes);

// Rutas de reportes
app.use('/api/reportes', reportesRoutes);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Sucursal bancaria en http://localhost:${PORT}`);
    });
}

module.exports = app;