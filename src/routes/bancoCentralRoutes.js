
const express = require('express');
const router = express.Router();

const bancoCentralController = require('../controllers/bancoCentralController');
const autorizacionSucursal = require('../middlewares/autorizacionSucursal');

// Consulta de saldo (temporalmente sin autenticación)
router.get('/saldo/:numeroCuenta', bancoCentralController.consultarSaldo);

// Operaciones que modifican información bancaria
router.post('/cuentas', autorizacionSucursal, bancoCentralController.crearCuenta);
router.post('/transferencias', autorizacionSucursal, bancoCentralController.realizarTransferencia);

module.exports = router;
