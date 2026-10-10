
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

async function cargarResumen() {
    const datos = await solicitarJSON(`${API}/reportes/resumen`);

    document.getElementById('totalClientes').textContent =
        datos.totalClientes;

    document.getElementById('totalTransacciones').textContent =
        datos.totalTransacciones;

    document.getElementById('totalDepositos').textContent =
        dinero(datos.totalDepositos);

    document.getElementById('totalRetiros').textContent =
        dinero(datos.totalRetiros);
}

async function cargarClientes() {
    const clientes = await solicitarJSON(`${API}/clientes`);
    const tabla = document.getElementById('tablaClientes');
    tabla.replaceChildren();

    for (const cliente of clientes) {
        const fila = document.createElement('tr');

        const valores = [
            cliente.id,
            cliente.numeroCuenta,
            cliente.nombre,
            dinero(cliente.saldo),
            cliente.estado
        ];

        for (const valor of valores) {
            const celda = document.createElement('td');
            celda.textContent = valor;
            fila.appendChild(celda);
        }

        tabla.appendChild(fila);
    }
}

async function cargarTransacciones() {
    const tipo = document.getElementById('filtroTipo').value;

    const url = `${API}/reportes/transacciones` +
        (tipo ? `?tipo=${encodeURIComponent(tipo)}` : '');

    const datos = await solicitarJSON(url);
    const tabla = document.getElementById('tablaTransacciones');

    tabla.replaceChildren();

    for (const transaccion of datos.transacciones) {
        const fila = document.createElement('tr');

        const valores = [
            transaccion.id,
            transaccion.cuentaId,
            transaccion.tipo,
            dinero(transaccion.monto),
            new Date(transaccion.fecha).toLocaleString('es-MX')
        ];

        for (const valor of valores) {
            const celda = document.createElement('td');
            celda.textContent = valor;
            fila.appendChild(celda);
        }

        tabla.appendChild(fila);
    }
}

async function actualizarPanel() {
    try {
        await Promise.all([
            cargarResumen(),
            cargarClientes(),
            cargarTransacciones()
        ]);
    } catch (error) {
        console.error(error);
        alert('Error al cargar información: ' + error.message);
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

document.getElementById('actualizarClientes')
    .addEventListener('click', actualizarPanel);

document.getElementById('filtroTipo')
    .addEventListener('change', async () => {
        try {
            await cargarTransacciones();
        } catch (error) {
            alert(error.message);
        }
    });

// Cargar datos simulados al iniciar
actualizarPanel();
