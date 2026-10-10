
const { randomUUID } = require('node:crypto');

const BASE_URL = process.env.BANCO_CENTRAL_URL;
const API_KEY = process.env.BANCO_API_KEY;

async function solicitarBancoCentral(endpoint, options = {}) {
    if (!BASE_URL || !API_KEY) {
        throw new Error('Falta configurar el Banco Central en .env');
    }

    const {
        method = 'GET',
        body,
        idempotencyKey
    } = options;

    const headers = {
        'Accept': 'application/json',
        'X-API-Key': API_KEY
    };

    if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
    }

    const maxIntentos = method === 'POST' && idempotencyKey ? 3 : 1;

    for (let intento = 1; intento <= maxIntentos; intento++) {
        try {
            const respuesta = await fetch(
                `${BASE_URL.replace(/\/$/, '')}${endpoint}`,
                {
                    method,
                    headers,
                    body: body === undefined
                        ? undefined
                        : JSON.stringify(body),
                    signal: AbortSignal.timeout(10000)
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                if (respuesta.status >= 500 && intento < maxIntentos) {
                    continue;
                }

                const error = new Error(
                    datos.error ||
                    datos.message ||
                    'Error del Banco Central'
                );

                error.status = respuesta.status;
                throw error;
            }

            return datos;

        } catch (error) {
            const esTimeout = error.name === 'TimeoutError';
            const esConexion = error instanceof TypeError;

            if ((esTimeout || esConexion) && intento < maxIntentos) {
                continue;
            }

            if (esTimeout || esConexion) {
                const fallo = new Error(
                    'No se pudo establecer comunicación con el Banco Central'
                );
                fallo.status = 503;
                throw fallo;
            }

            throw error;
        }
    }
}

// Crear cuenta bancaria
async function abrirCuenta(datosCuenta) {
    return solicitarBancoCentral('/api/accounts', {
        method: 'POST',
        body: datosCuenta
    });
}

// Consultar saldo
async function consultarSaldo(numeroCuenta) {
    return solicitarBancoCentral(
        `/api/balance/${encodeURIComponent(numeroCuenta)}`
    );
}

// Transferir dinero
async function transferir(datosTransferencia, idempotencyKey = randomUUID()) {
    return solicitarBancoCentral('/api/transfer', {
        method: 'POST',
        body: datosTransferencia,
        idempotencyKey
    });
}


/* ==========================================
   HISTORIAL Y REPORTES DEL BANCO CENTRAL
========================================== */

// Obtener información de la sucursal autenticada
async function obtenerSucursal() {
    return solicitarBancoCentral('/api/nodes/me');
}

// Consultar historial real de la sucursal
async function obtenerHistorialSucursal(filtros = {}) {
    const parametros = new URLSearchParams();

    if (filtros.type) {
        parametros.set('type', filtros.type);
    }

    if (filtros.from) {
        parametros.set('from', filtros.from);
    }

    if (filtros.to) {
        parametros.set('to', filtros.to);
    }

    if (filtros.limit) {
        parametros.set('limit', String(filtros.limit));
    }

    const query = parametros.toString();

    return solicitarBancoCentral(
        '/api/nodes/me/transactions' +
        (query ? `?${query}` : '')
    );
}

// Consultar historial real por número de cuenta
async function obtenerHistorialCuenta(numeroCuenta, filtros = {}) {
    const parametros = new URLSearchParams();

    if (filtros.type) {
        parametros.set('type', filtros.type);
    }

    if (filtros.from) {
        parametros.set('from', filtros.from);
    }

    if (filtros.to) {
        parametros.set('to', filtros.to);
    }

    if (filtros.limit) {
        parametros.set('limit', String(filtros.limit));
    }

    const query = parametros.toString();

    return solicitarBancoCentral(
        `/api/accounts/${encodeURIComponent(numeroCuenta)}/transactions` +
        (query ? `?${query}` : '')
    );
}

// Consultar reportes administrativos reales
async function obtenerReporteSucursal(filtros = {}) {
    const parametros = new URLSearchParams();

    if (filtros.type) {
        parametros.set('type', filtros.type);
    }

    if (filtros.from) {
        parametros.set('from', filtros.from);
    }

    if (filtros.to) {
        parametros.set('to', filtros.to);
    }

    const query = parametros.toString();

    return solicitarBancoCentral(
        '/api/nodes/me/reports' +
        (query ? `?${query}` : '')
    );
}

// Buscar cuentas reales en el Banco Central
async function buscarCuentas(termino) {
    const parametros = new URLSearchParams({
        q: termino
    });

    return solicitarBancoCentral(
        `/api/accounts/search?${parametros.toString()}`
    );
}

module.exports = {
    abrirCuenta,
    consultarSaldo,
    transferir,
    obtenerSucursal,
    obtenerHistorialSucursal,
    obtenerHistorialCuenta,
    obtenerReporteSucursal,
    buscarCuentas
};