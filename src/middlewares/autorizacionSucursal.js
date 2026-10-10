
const { timingSafeEqual } = require('node:crypto');

function autorizacionSucursal(req, res, next) {
    const claveConfigurada = process.env.SUCURSAL_ADMIN_KEY;
    const claveRecibida = req.get('X-Sucursal-Key');

    if (!claveConfigurada) {
        return res.status(503).json({
            error: 'Autorización de sucursal no configurada'
        });
    }

    if (!claveRecibida) {
        return res.status(401).json({
            error: 'Se requiere autorización de sucursal'
        });
    }

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

    next();
}

module.exports = autorizacionSucursal;
