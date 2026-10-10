
const bancoCentral = require('../services/BancoCentralClient');

async function consultarSaldo(req, res) {
    try {
        const { numeroCuenta } = req.params;

        if (!/^\d{8,20}$/.test(numeroCuenta)) {
            return res.status(400).json({
                error: 'El número de cuenta debe contener entre 8 y 20 dígitos'
            });
        }

        const resultado = await bancoCentral.consultarSaldo(numeroCuenta);

        return res.status(200).json(resultado);

    } catch (error) {
        console.error('Error al consultar saldo:', error.message);

        return res.status(error.status || 500).json({
            error: error.message
        });
    }
}


async function crearCuenta(req, res) {
    try {

        console.log('Content-Type:', req.headers['content-type']);
        console.log('BODY RECIBIDO:', req.body);

        if (!req.body || typeof req.body !== 'object') {
            return res.status(400).json({
                error: 'No se recibió un cuerpo JSON válido'
            });
        }


        const {
            account_number,
            holder_name,
            pin,
            initial_balance = 0
        } = req.body;

        if (!/^\d{8,20}$/.test(String(account_number || ''))) {
            return res.status(400).json({
                error: 'El número de cuenta debe tener entre 8 y 20 dígitos'
            });
        }

        if (
            typeof holder_name !== 'string' ||
            !holder_name.trim() ||
            holder_name.length > 150
        ) {
            return res.status(400).json({
                error: 'El nombre del titular es obligatorio (máximo 150 caracteres)'
            });
        }

        if (
            typeof pin !== 'string' ||
            pin.length < 4 ||
            pin.length > 8
        ) {
            return res.status(400).json({
                error: 'El PIN debe tener entre 4 y 8 caracteres'
            });
        }

        if (
            typeof initial_balance !== 'number' ||
            !Number.isFinite(initial_balance) ||
            initial_balance < 0 ||
            initial_balance > 10000
        ) {
            return res.status(400).json({
                error: 'El saldo inicial debe estar entre 0 y 10000'
            });
        }

        const resultado = await bancoCentral.abrirCuenta({
            account_number,
            holder_name: holder_name.trim(),
            pin,
            initial_balance
        });

        return res.status(201).json(resultado);

    } catch (error) {
        console.error('Error al crear cuenta:', error.message);

        return res.status(error.status || 500).json({
            error: error.message
        });
    }
}


async function realizarTransferencia(req, res) {
    try {
        const {
            from_account_number,
            to_account_number,
            amount
        } = req.body || {};

        const cuentaValida = /^\d{8,20}$/;

        if (
            !cuentaValida.test(String(from_account_number || '')) ||
            !cuentaValida.test(String(to_account_number || ''))
        ) {
            return res.status(400).json({
                error: 'Los números de cuenta deben tener entre 8 y 20 dígitos'
            });
        }

        if (from_account_number === to_account_number) {
            return res.status(400).json({
                error: 'Las cuentas origen y destino deben ser diferentes'
            });
        }

        if (
            typeof amount !== 'number' ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            return res.status(400).json({
                error: 'El monto debe ser un número mayor que cero'
            });
        }

        const idempotencyKey = req.get('Idempotency-Key');

        if (
            idempotencyKey &&
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idempotencyKey)
        ) {
            return res.status(400).json({
                error: 'Idempotency-Key debe tener formato UUID'
            });
        }

        const resultado = await bancoCentral.transferir(
            {
                from_account_number,
                to_account_number,
                amount
            },
            idempotencyKey || undefined
        );

        return res.status(200).json(resultado);

    } catch (error) {
        console.error('Error al transferir:', error.message);

        return res.status(error.status || 500).json({
            error: error.message
        });
    }
}


module.exports = {
    consultarSaldo,
    crearCuenta,
    realizarTransferencia
};
