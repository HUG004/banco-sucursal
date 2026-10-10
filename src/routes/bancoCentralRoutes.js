
const express = require('express');
const router = express.Router();

const bancoCentralController = require('../controllers/bancoCentralController');
const autorizacionSucursal = require('../middlewares/autorizacionSucursal');

router.get(
    '/saldo/:numeroCuenta',
    autorizacionSucursal,
    bancoCentralController.consultarSaldo
);

// Operaciones que modifican información bancaria
router.post('/cuentas', autorizacionSucursal, bancoCentralController.crearCuenta);
router.post('/transferencias', autorizacionSucursal, bancoCentralController.realizarTransferencia);


/* ==========================================
   CONSULTAS REALES DEL BANCO CENTRAL
========================================== */

// Información de la sucursal autenticada
router.get(
    '/sucursal',
    autorizacionSucursal,
    bancoCentralController.obtenerSucursal
);

// Historial de transacciones de la sucursal
router.get(
    '/sucursal/transacciones',
    autorizacionSucursal,
    bancoCentralController.obtenerHistorialSucursal
);

// Historial por número de cuenta
router.get(
    '/cuentas/:numeroCuenta/transacciones',
    autorizacionSucursal,
    bancoCentralController.obtenerHistorialCuenta
);

// Reportes administrativos de la sucursal
router.get(
    '/sucursal/reportes',
    autorizacionSucursal,
    bancoCentralController.obtenerReporteSucursal
);

router.get(
    '/cuentas/buscar',
    autorizacionSucursal,
    bancoCentralController.buscarCuentas
);

module.exports = router;
