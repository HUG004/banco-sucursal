const clientes = require('../data/clientes');
const transacciones = require('../data/transacciones');

// Reporte general de la sucursal
const obtenerResumen = (req, res) => {

    const totalClientes = clientes.length;
    const totalTransacciones = transacciones.length;

    const depositos = transacciones.filter(
        t => t.tipo === 'deposito'
    );

    const retiros = transacciones.filter(
        t => t.tipo === 'retiro'
    );

    const totalDepositos = depositos.reduce(
        (total, t) => total + t.monto, 0
    );

    const totalRetiros = retiros.reduce(
        (total, t) => total + t.monto, 0
    );

    res.status(200).json({
        sucursal: 'Sucursal Bancaria - Nodo 2',
        modo: 'simulacion',
        totalClientes,
        totalTransacciones,
        cantidadDepositos: depositos.length,
        cantidadRetiros: retiros.length,
        totalDepositos,
        totalRetiros,
        fechaReporte: new Date().toISOString()
    });
};

// Reporte detallado de transacciones
const obtenerReporteTransacciones = (req, res) => {

    const { tipo } = req.query;

    if (tipo && !['deposito', 'retiro', 'transferencia'].includes(tipo)) {
        return res.status(400).json({
            error: 'Tipo de transacción inválido'
        });
    }

    const movimientos = tipo
        ? transacciones.filter(t => t.tipo === tipo)
        : transacciones;

    res.status(200).json({
        sucursal: 'Sucursal Bancaria - Nodo 2',
        modo: 'simulacion',
        total: movimientos.length,
        transacciones: movimientos
    });
};

module.exports = {
    obtenerResumen,
    obtenerReporteTransacciones
};