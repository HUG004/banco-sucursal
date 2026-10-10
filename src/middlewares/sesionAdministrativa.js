
const {
    createHmac,
    randomUUID,
    timingSafeEqual
} = require('node:crypto');

const COOKIE_NAME = 'sucursal_session';
const DURACION_SESION = 60 * 60 * 1000;

function configurarCookie() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: DURACION_SESION
    };
}

function generarFirma(datos) {
    const secreto = process.env.SESSION_SECRET;

    if (!secreto || secreto.length < 64) {
        throw new Error('SESSION_SECRET no está configurado correctamente');
    }

    return createHmac('sha256', secreto)
        .update(datos)
        .digest('hex');
}

function crearSesion(res) {
    const vencimiento = Date.now() + DURACION_SESION;

    const datos = `${randomUUID()}.${vencimiento}`;
    const firma = generarFirma(datos);

    res.cookie(
        COOKIE_NAME,
        `${datos}.${firma}`,
        configurarCookie()
    );
}

function verificarSesion(req) {
    const token = req.cookies?.[COOKIE_NAME];

    if (typeof token !== 'string') {
        return false;
    }

    const partes = token.split('.');

    if (partes.length !== 3) {
        return false;
    }

    const [identificador, vencimientoTexto, firmaRecibida] = partes;

    if (
        !/^[0-9a-f-]{36}$/.test(identificador) ||
        !/^\d{13}$/.test(vencimientoTexto) ||
        !/^[0-9a-f]{64}$/.test(firmaRecibida)
    ) {
        return false;
    }

    const vencimiento = Number(vencimientoTexto);

    if (!Number.isSafeInteger(vencimiento) || Date.now() >= vencimiento) {
        return false;
    }

    const datos = `${identificador}.${vencimientoTexto}`;
    const firmaEsperada = generarFirma(datos);

    return timingSafeEqual(
        Buffer.from(firmaEsperada, 'hex'),
        Buffer.from(firmaRecibida, 'hex')
    );
}

function cerrarSesion(res) {
    const opciones = configurarCookie();
    delete opciones.maxAge;

    res.clearCookie(COOKIE_NAME, opciones);
}

module.exports = {
    crearSesion,
    verificarSesion,
    cerrarSesion
};
