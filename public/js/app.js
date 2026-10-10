
const API = '/api';

const dinero = valor =>
    new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(Number(valor));

async function solicitarJSON(url, opciones = {}) {
    const respuesta = await fetch(url, opciones);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.error ||
            datos.message ||
            'Error del servidor'
        );
    }

    return datos;
}

// ==========================================
// DATOS LOCALES DE SIMULACIÓN
// ==========================================

/* ==========================================
   DATOS REALES DEL BANCO CENTRAL
========================================== */

function agregarFila(tabla, valores) {
    const fila = document.createElement('tr');

    for (const valor of valores) {
        const celda = document.createElement('td');
        celda.textContent = String(valor ?? '—');
        fila.appendChild(celda);
    }

    tabla.appendChild(fila);
}

async function cargarResumen() {
    const [reporte, sucursal] = await Promise.all([
        solicitarJSON(`${API}/banco/sucursal/reportes`),
        solicitarJSON(`${API}/banco/sucursal`)
    ]);

    const resumen = reporte.summary;
    const tipos = resumen.by_type || [];

    const transferencias = tipos.find(
        item => item.type === 'transfer'
    );

    document.getElementById('montoTotalOperado').textContent =
        dinero(resumen.total_amount);

    document.getElementById('totalTransferencias').textContent =
        transferencias?.count ?? 0;

    document.getElementById('montoTransferencias').textContent =
        dinero(transferencias?.amount ?? 0);

    const montoPorTipo = tipo =>
        tipos.find(item => item.type === tipo)?.amount ?? 0;

    document.getElementById('totalClientes').textContent =
        sucursal.name;

    document.getElementById('totalTransacciones').textContent =
        resumen.total_transactions;

    document.getElementById('totalDepositos').textContent =
        dinero(montoPorTipo('deposit'));

    document.getElementById('totalRetiros').textContent =
        dinero(montoPorTipo('withdrawal'));
}

async function cargarTransacciones() {
    const tipo = document.getElementById('filtroTipo').value;

    const parametros = new URLSearchParams();

    if (tipo) {
        parametros.set('type', tipo);
    }

    const query = parametros.toString();

    const url = `${API}/banco/sucursal/transacciones` +
        (query ? `?${query}` : '');

    const datos = await solicitarJSON(url);

    const tabla = document.getElementById('tablaTransacciones');
    tabla.replaceChildren();

    for (const transaccion of datos.transactions || []) {
        agregarFila(tabla, [
            transaccion.id,
            transaccion.origin_account,
            transaccion.destination_account,
            transaccion.type,
            dinero(transaccion.amount),
            new Date(transaccion.created_at).toLocaleString('es-MX')
        ]);
    }

    if (!datos.transactions?.length) {
        agregarFila(tabla, [
            'Sin movimientos', '—', '—', '—', '—', '—'
        ]);
    }
}

async function actualizarPanel() {
    try {
        await Promise.all([
            cargarResumen(),
            cargarTransacciones()
        ]);
    } catch (error) {
        console.error('Error al actualizar el panel:', error.message);
        alert('No se pudo actualizar el panel: ' + error.message);
    }
}


// ==========================================
// REGISTRAR CUENTA EN EL BANCO CENTRAL
// ==========================================

document.getElementById('formCliente')
    .addEventListener('submit', async evento => {
        evento.preventDefault();

        const formulario = evento.currentTarget;
        const boton = formulario.querySelector('button[type="submit"]');
        const mensaje = document.getElementById('mensajeRegistro');

        const account_number =
            document.getElementById('numeroCuenta').value.trim();

        const holder_name =
            document.getElementById('nombre').value.trim();

        const pin =
            document.getElementById('pin').value;

        const initial_balance = Number(
            document.getElementById('saldoInicial').value
        );

        boton.disabled = true;
        mensaje.textContent = 'Registrando cuenta...';
        mensaje.className = '';

        try {
            const datos = await solicitarJSON(`${API}/banco/cuentas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    account_number,
                    holder_name,
                    pin,
                    initial_balance
                })
            });

            const cuenta = datos.account;

            mensaje.textContent =
                `Cuenta ${cuenta.account_number} creada correctamente. ` +
                `Titular: ${cuenta.holder_name}. ` +
                `Saldo: ${dinero(cuenta.balance)}.`;

            mensaje.className = 'exito';

            formulario.reset();

        } catch (error) {
            mensaje.textContent = error.message;
            mensaje.className = 'error';

        } finally {
            boton.disabled = false;
        }
    });

// ==========================================
// CONSULTAR SALDO REAL
// ==========================================

document.getElementById('formConsultaSaldo')
    .addEventListener('submit', async evento => {
        evento.preventDefault();

        const formulario = evento.currentTarget;
        const boton = formulario.querySelector('button[type="submit"]');

        const numeroCuenta =
            document.getElementById('cuentaConsulta').value.trim();

        const resultado = document.getElementById('resultadoSaldo');

        boton.disabled = true;
        resultado.textContent = 'Consultando saldo...';
        resultado.className = '';

        try {
            const datos = await solicitarJSON(
                `${API}/banco/saldo/${encodeURIComponent(numeroCuenta)}`
            );

            resultado.replaceChildren();

            const titulo = document.createElement('h3');
            titulo.textContent = 'Información de la cuenta';

            const cuenta = document.createElement('p');
            cuenta.textContent =
                `Número de cuenta: ${datos.account_number}`;

            const titular = document.createElement('p');
            titular.textContent =
                `Titular: ${datos.holder_name}`;

            const saldo = document.createElement('p');
            saldo.textContent =
                `Saldo disponible: ${dinero(datos.balance)}`;

            const estado = document.createElement('p');
            estado.textContent =
                `Estado: ${datos.status}`;

            resultado.append(
                titulo,
                cuenta,
                titular,
                saldo,
                estado
            );

            resultado.className = 'exito';

        } catch (error) {
            resultado.textContent = error.message;
            resultado.className = 'error';

        } finally {
            boton.disabled = false;
        }
    });

// ==========================================
// EVENTOS DEL PANEL SIMULADO
// ==========================================


document.getElementById('filtroTipo')
    .addEventListener('change', async () => {
        try {
            await cargarTransacciones();
        } catch (error) {
            alert(error.message);
        }
    });


/* ==========================================
   AUTENTICACIÓN ADMINISTRATIVA
========================================== */

const formLogin = document.getElementById('formLogin');
const panelSesion = document.getElementById('panelSesion');
const mensajeLogin = document.getElementById('mensajeLogin');
const botonCerrarSesion = document.getElementById('botonCerrarSesion');
const seccionesProtegidas = document.querySelectorAll('[data-requiere-auth]');

function mostrarEstadoAutenticacion(autenticado) {
    formLogin.hidden = autenticado;
    panelSesion.hidden = !autenticado;

    seccionesProtegidas.forEach(seccion => {
        seccion.hidden = !autenticado;
    });
}

// Comprobar si ya existe una sesión
async function comprobarSesion() {
    try {
        const datos = await solicitarJSON('/api/auth/estado', {
            credentials: 'same-origin'
        });

        mostrarEstadoAutenticacion(datos.autenticado);
        if (datos.autenticado) {
            await actualizarPanel();
        }
    } catch (error) {
        mostrarEstadoAutenticacion(false);
        mensajeLogin.textContent = error.message;
        mensajeLogin.className = 'error';
    }
}

// Iniciar sesión
formLogin.addEventListener('submit', async evento => {
    evento.preventDefault();

    const boton = formLogin.querySelector('button[type="submit"]');
    const clave = document.getElementById('claveAdministrador').value;

    boton.disabled = true;
    mensajeLogin.textContent = 'Iniciando sesión...';
    mensajeLogin.className = '';

    try {
        const datos = await solicitarJSON('/api/auth/login', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clave })
        });

        mostrarEstadoAutenticacion(datos.autenticado);
        if (datos.autenticado) {
            await actualizarPanel();
        }

        formLogin.reset();

        mensajeLogin.textContent = 'Inicio de sesión exitoso.';
        mensajeLogin.className = 'exito';

    } catch (error) {
        mostrarEstadoAutenticacion(false);

        mensajeLogin.textContent = error.message;
        mensajeLogin.className = 'error';

    } finally {
        boton.disabled = false;
    }
});

// Cerrar sesión
botonCerrarSesion.addEventListener('click', async () => {
    botonCerrarSesion.disabled = true;

    try {
        await solicitarJSON('/api/auth/logout', {
            method: 'POST',
            credentials: 'same-origin'
        });

        mostrarEstadoAutenticacion(false);

        mensajeLogin.textContent = 'Sesión cerrada correctamente.';
        mensajeLogin.className = 'exito';

        document.getElementById('resultadoSaldo').replaceChildren();
        document.getElementById('mensajeRegistro').textContent = '';

    } catch (error) {
        mensajeLogin.textContent = error.message;
        mensajeLogin.className = 'error';

    } finally {
        botonCerrarSesion.disabled = false;
    }
});

// Verificar la sesión al abrir el panel
comprobarSesion();


/* ==========================================
   CONSULTAR HISTORIAL REAL POR CUENTA
========================================== */

document.getElementById('formHistorialCuenta')
    .addEventListener('submit', async evento => {
        evento.preventDefault();

        const formulario = evento.currentTarget;
        const boton = formulario.querySelector('button[type="submit"]');

        const numeroCuenta = document
            .getElementById('numeroCuentaHistorial')
            .value.trim();

        const mensaje = document.getElementById('mensajeHistorialCuenta');
        const informacion = document.getElementById('informacionCuentaHistorial');
        const tabla = document.getElementById('tablaHistorialCuenta');

        boton.disabled = true;
        mensaje.textContent = 'Consultando historial...';
        informacion.replaceChildren();
        tabla.replaceChildren();

        try {
            const datos = await solicitarJSON(
                `${API}/banco/cuentas/${encodeURIComponent(numeroCuenta)}/transacciones`
            );

            const cuenta = datos.account;

            const detalle = document.createElement('p');
            detalle.textContent =
                `Titular: ${cuenta.holder_name} | ` +
                `Cuenta: ${cuenta.account_number} | ` +
                `Saldo: ${dinero(cuenta.balance)}`;

            informacion.appendChild(detalle);

            for (const transaccion of datos.transactions || []) {
                agregarFila(tabla, [
                    new Date(transaccion.created_at).toLocaleString('es-MX'),
                    transaccion.type,
                    transaccion.origin_account,
                    transaccion.destination_account,
                    dinero(transaccion.amount),
                    transaccion.node?.name || 'No disponible'
                ]);
            }

            if (!datos.transactions?.length) {
                agregarFila(tabla, [
                    'Sin movimientos', '—', '—', '—', '—', '—'
                ]);
            }

            mensaje.textContent =
                `Se encontraron ${datos.count} transacciones.`;

            mensaje.className = 'exito';

        } catch (error) {
            mensaje.textContent = error.message;
            mensaje.className = 'error';
        } finally {
            boton.disabled = false;
        }
    });


/* ==========================================
   BUSCAR CUENTAS REALES DEL BANCO CENTRAL
========================================== */

document.getElementById('formBuscarCuentas')
    .addEventListener('submit', async evento => {

        evento.preventDefault();

        const termino = document
            .getElementById('terminoBusqueda')
            .value.trim();

        const mensaje = document.getElementById('mensajeBusqueda');
        const tabla = document.getElementById('tablaBusquedaCuentas');
        const boton = document.getElementById('botonBuscarCuentas');

        if (!termino) {
            mensaje.textContent = 'Ingresa un nombre o número de cuenta.';
            mensaje.className = 'error';
            return;
        }

        boton.disabled = true;
        mensaje.textContent = 'Buscando cuentas...';
        mensaje.className = '';
        tabla.replaceChildren();

        try {
            const datos = await solicitarJSON(
                `${API}/banco/cuentas/buscar?q=${encodeURIComponent(termino)}`
            );

            for (const cuenta of datos.accounts || []) {
                agregarFila(tabla, [
                    cuenta.account_number,
                    cuenta.holder_name,
                    dinero(cuenta.balance),
                    cuenta.status
                ]);
            }

            if (!datos.accounts?.length) {
                agregarFila(tabla, [
                    'Sin resultados', '—', '—', '—'
                ]);
            }

            mensaje.textContent =
                `Se encontraron ${datos.count} cuentas.`;

            mensaje.className = 'exito';

        } catch (error) {
            mensaje.textContent = error.message;
            mensaje.className = 'error';

        } finally {
            boton.disabled = false;
        }
    });
