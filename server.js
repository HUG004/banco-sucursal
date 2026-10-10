
require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./src/routes/authRoutes');
const path = require('path');
const fs = require('fs');

// Importación de rutas
const bancoCentralRoutes = require('./src/routes/bancoCentralRoutes');

const app = express();
if (process.env.VERCEL === '1') {
    app.set('trust proxy', 1);
}
const PORT = Number(process.env.PORT) || 3002;

const publicPath = path.join(__dirname, 'public');
const indexPath = path.join(publicPath, 'index.html');

// ==========================================
// 1. MIDDLEWARES
// ==========================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// 2. RUTA DE SALUD
// ==========================================

app.get('/api/salud', (req, res) => {
    res.status(200).json({
        estado: 'OK',
        servicio: 'Nodo 2 - Sucursal Bancaria',
        mensaje: 'Servidor funcionando correctamente'
    });
});

// ==========================================
// 3. RUTAS DE LA API
// ==========================================

// Autenticación administrativa
app.use('/api/auth', authRoutes);

// Integración con el Banco Central
app.use('/api/banco', bancoCentralRoutes);

// ==========================================
// 4. ARCHIVOS ESTÁTICOS
// ==========================================

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

// ==========================================
// 5. RUTA NO ENCONTRADA
// ==========================================

app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({
            error: 'Endpoint no encontrado'
        });
    }

    res.status(404).send('Página no encontrada');
});

// ==========================================
// 6. MANEJO DE ERRORES
// ==========================================

app.use((error, req, res, next) => {
    console.error('Error en Express:', error.message);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        error: 'Error interno del servidor'
    });
});

// ==========================================
// 7. INICIO DEL SERVIDOR
// ==========================================

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

// Exportación para Vercel
module.exports = app;
