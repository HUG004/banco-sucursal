const express = require('express');

const clientesRoutes = require('./src/routes/clientesRoutes');
const transaccionesRoutes = require('./src/routes/transaccionesRoutes');
const reportesRoutes = require('./src/routes/reportesRoutes');

const app = express();
const PORT = process.env.PORT || 3002;


app.use(express.json());
app.use(express.static('public'));
app.use('/api/reportes', reportesRoutes);
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

app.use('/api/transacciones', transaccionesRoutes);


if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Sucursal bancaria en http://localhost:${PORT}`);
    });
}

module.exports = app;