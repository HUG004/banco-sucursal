const transacciones = [
    {
        id: 1,
        cuentaId: 1,
        tipo: 'deposito',
        monto: 1000,
        sucursalId: 1,
        fecha: new Date().toISOString(),
        descripcion: 'Apertura de cuenta (simulación)'
    }
];

module.exports = transacciones;