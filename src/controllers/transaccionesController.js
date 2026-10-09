const transacciones = require('../data/transacciones');
const clientes = require('../data/clientes');

// Consultar todas las transacciones
const obtenerTransacciones = (req, res) => {
    res.status(200).json(transacciones);
};

// Consultar transacciones de un cliente
const obtenerTransaccionesPorCliente = (req, res) => {
    const clienteId = Number(req.params.id);

    if (!Number.isInteger(clienteId) || clienteId <= 0) {
        return res.status(400).json({
            error: 'ID de cliente inválido'
        });
    }

    const cliente = clientes.find(c => c.id === clienteId);

    if (!cliente) {
        return res.status(404).json({
            error: 'Cliente no encontrado'
        });
    }

    const historial = transacciones.filter(
        t => t.cuentaId === clienteId
    );

    res.status(200).json({
        cliente: cliente.nombre,
        numeroCuenta: cliente.numeroCuenta,
        totalTransacciones: historial.length,
        transacciones: historial
    });
};

module.exports = {
    obtenerTransacciones,
    obtenerTransaccionesPorCliente
};