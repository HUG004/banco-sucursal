const API = '/api';

const dinero = valor =>
    new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(valor);

async function solicitarJSON(url, opciones = {}) {
    const respuesta = await fetch(url, opciones);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || 'Error del servidor');
    }

    return datos;
}

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

document.getElementById('formCliente')
    .addEventListener('submit', async evento => {
        evento.preventDefault();

        const mensaje = document.getElementById('mensajeRegistro');
        const nombre = document.getElementById('nombre').value.trim();
        const saldoInicial = Number(
            document.getElementById('saldoInicial').value
        );

        try {
            const datos = await solicitarJSON(`${API}/clientes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nombre, saldoInicial })
            });

            mensaje.textContent =
                `Cuenta creada: ${datos.cliente.numeroCuenta}`;
            mensaje.className = 'exito';

            evento.target.reset();
            await actualizarPanel();
        } catch (error) {
            mensaje.textContent = error.message;
            mensaje.className = 'error';
        }
    });

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

actualizarPanel();
