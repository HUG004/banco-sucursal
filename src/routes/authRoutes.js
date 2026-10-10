
const express = require('express');
const { timingSafeEqual } = require('node:crypto');

const {
    crearSesion,
    verificarSesion,
    cerrarSesion
} = require('../middlewares/sesionAdministrativa');

const router = express.Router();

// Comparación segura de credenciales
function clavesIguales(esperada, recibida) {
    const a = Buffer.from(esperada);
    const b = Buffer.from(recibida);

    return a.length === b.length && timingSafeEqual(a, b);
}

// Comprobar que una solicitud viene de nuestro propio sitio
function origenValido(req) {
    const origen = req.get('Origin');

    if (!origen) {
        return false;
    }

    try {
        const url = new URL(origen);
        return url.origin === `${req.protocol}://${req.get('host')}`;
    } catch {
        return false;
    }
}

// POST /api/auth/login
router.post('/login', (req, res) => {
    if (!origenValido(req)) {
        return res.status(403).json({
            error: 'Origen de solicitud no autorizado'
        });
    }

    const claveConfigurada = process.env.SUCURSAL_ADMIN_KEY;
    const claveRecibida = req.body?.clave;

    if (!claveConfigurada || !process.env.SESSION_SECRET) {
        return res.status(503).json({
            error: 'Autenticación administrativa no configurada'
        });
    }

    if (
        typeof claveRecibida !== 'string' ||
        !clavesIguales(claveConfigurada, claveRecibida)
    ) {
        return res.status(401).json({
            error: 'Credenciales incorrectas'
        });
    }

    crearSesion(res);

    return res.status(200).json({
        mensaje: 'Sesión iniciada correctamente',
        autenticado: true
    });
});

// GET /api/auth/estado
router.get('/estado', (req, res) => {
    return res.status(200).json({
        autenticado: verificarSesion(req)
    });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    if (!origenValido(req)) {
        return res.status(403).json({
            error: 'Origen de solicitud no autorizado'
        });
    }

    cerrarSesion(res);

    return res.status(200).json({
        mensaje: 'Sesión cerrada correctamente',
        autenticado: false
    });
});

module.exports = router;
