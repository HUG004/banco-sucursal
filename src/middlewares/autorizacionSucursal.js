
const { timingSafeEqual } = require('node:crypto');
const { verificarSesion } = require('./sesionAdministrativa');

function autorizacionSucursal(req, res, next) {
    const claveConfigurada = process.env.SUCURSAL_ADMIN_KEY;
    const claveRecibida = req.get('X-Sucursal-Key');

    if (!claveConfigurada) {
        return res.status(503).json({
            error: 'Autorización de sucursal no configurada'
        });
    }

    // Autorización para peticiones realizadas con API Key
    if (claveRecibida !== undefined) {
        const esperada = Buffer.from(claveConfigurada);
        const recibida = Buffer.from(claveRecibida);

        if (
            esperada.length !== recibida.length ||
            !timingSafeEqual(esperada, recibida)
        ) {
            return res.status(403).json({
                error: 'Credenciales de sucursal incorrectas'
            });
        }

        return next();
    }

    // Autorización mediante sesión del navegador
    if (verificarSesion(req)) {
        // Comprobar el origen en operaciones que modifican datos
        if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            const origen = req.get('Origin');

            if (!origen) {
                return res.status(403).json({
                    error: 'Se requiere un origen válido'
                });
            }

            let origenEsperado;

            try {
                origenEsperado = new URL(
                    `${req.protocol}://${req.get('host')}`
                ).origin;
            } catch {
                return res.status(403).json({
                    error: 'Origen no válido'
                });
            }

            if (origen !== origenEsperado) {
                return res.status(403).json({
                    error: 'Origen de solicitud no autorizado'
                });
            }
        }

        return next();
    }

    return res.status(401).json({
        error: 'Se requiere autorización de sucursal'
    });
}

module.exports = autorizacionSucursal;
