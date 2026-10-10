require('dotenv').config();

const express = require('express');
const path = require('path');
const fs = require('fs');

const clientesRoutes = require('./src/routes/clientesRoutes');
const transaccionesRoutes = require('./src/routes/transaccionesRoutes');
const reportesRoutes = require('./src/routes/reportesRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 3002;

const publicPath = path.join(__dirname, 'public');
const indexPath = path.join(publicPath, 'index.html');

// Middleware para recibir JSON
app.use(express.json());

// Ruta de salud
app.get('/api/salud', (req, res) => {
    res.status(200).json({
        estado: 'OK',
        servicio: 'Nodo 2 - Sucursal Bancaria',
        mensaje: 'Servidor funcionando correctamente'
    });
});

// Rutas de la API
app.use('/api/clientes', clientesRoutes);
app.use('/api/transacciones', transaccionesRoutes);
app.use('/api/reportes', reportesRoutes);

// Archivos estáticos: HTML, CSS y JavaScript
app.use(express.static(publicPath));

// Página principal
app.get('/', (req, res) => {
    res.sendFile(indexPath, (error) => {
        if (error && !res.headersSent) {
            console.error('Error al servir index.html:', error.message);
            res.status(500).json({
                error: 'No se pudo cargar el panel de la sucursal'
            });
        }
    });
});

// Ruta no encontrada
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            error: 'Endpoint no encontrado'
        });
    }

    res.status(404).send('Página no encontrada');
});

// Manejo de errores
app.use((error, req, res, next) => {
    console.error('Error en Express:', error.message);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        error: 'Error interno del servidor'
    });
});

// Inicio local y exportación para Vercel
if (require.main === module) {
    console.log('Iniciando Nodo 2 - Sucursal Bancaria...');
    console.log('Directorio público:', publicPath);
    console.log('index.html existe:', fs.existsSync(indexPath));

    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor escuchando en puerto ${PORT}`);
        console.log(`Panel: http://localhost:${PORT}/`);
        console.log(`API: http://localhost:${PORT}/api/salud`);
    });

    server.on('error', (error) => {
        console.error('Error al iniciar el servidor:', error.message);
        process.exitCode = 1;
    });

    server.on('close', () => {
        console.log('El servidor HTTP se ha cerrado');
    });
}

module.exports = app;
