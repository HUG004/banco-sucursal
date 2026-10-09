const express = require('express');

const router = express.Router();

const {
    registrarCliente,
    obtenerClientes,
    obtenerClientePorId
} = require('../controllers/clientesController');

router.post('/', registrarCliente);

router.get('/', obtenerClientes);

router.get('/:id', obtenerClientePorId);

module.exports = router;