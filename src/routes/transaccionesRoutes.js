const express = require('express');

const router = express.Router();

const {
    obtenerTransacciones,
    obtenerTransaccionesPorCliente
} = require('../controllers/transaccionesController');

router.get('/', obtenerTransacciones);

router.get('/cliente/:id', obtenerTransaccionesPorCliente);

module.exports = router;