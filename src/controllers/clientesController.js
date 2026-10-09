const clientes = require('../data/clientes');

// Registrar nuevo cliente
const registrarCliente = (req, res) => {
    const { nombre, saldoInicial } = req.body;

    if (
        typeof nombre !== 'string' ||
        !nombre.trim() ||
        typeof saldoInicial !== 'number' ||
        !Number.isFinite(saldoInicial) ||
        saldoInicial < 0
    ) {
        return res.status(400).json({
            error: 'Nombre o saldo inicial inválido'
        });
    }

    const nuevoCliente = {
        id: clientes.length + 1,
        numeroCuenta: `CTA-${String(clientes.length + 1).padStart(4, '0')}`,
        nombre: nombre.trim(),
        saldo: saldoInicial,
        estado: 'activa'
    };

    clientes.push(nuevoCliente);

    res.status(201).json({
        mensaje: 'Cliente registrado correctamente (simulación)',
        cliente: nuevoCliente
    });
};

// Obtener todos los clientes
const obtenerClientes = (req, res) => {
    res.status(200).json(clientes);
};

// Obtener cliente por ID
const obtenerClientePorId = (req, res) => {
    const id = Number(req.params.id);

    const cliente = clientes.find(c => c.id === id);

    if (!cliente) {
        return res.status(404).json({
            error: 'Cliente no encontrado'
        });
    }

    res.status(200).json(cliente);
};

module.exports = {
    registrarCliente,
    obtenerClientes,
    obtenerClientePorId
};