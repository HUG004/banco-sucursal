const express = require('express');

const router = express.Router();

const {
    obtenerResumen,
    obtenerReporteTransacciones
} = require('../controllers/reportesController');

router.get('/resumen', obtenerResumen);

router.get('/transacciones', obtenerReporteTransacciones);

module.exports = router;