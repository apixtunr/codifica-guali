/* Configuración inicial y variables globales */
const TAM = 6; 
let pistasGuardadas = [];
let pistaActual = null;
let movimientos = [];
let robot = { x: 0, y: 4, dir: 0 }; /* dir: 0=arriba, 1=derecha, 2=abajo, 3=izquierda */


/* función para elegir aleatoriamente una de las pistas almacenadas al recargar la página */
function randomInt(max) { return Math.floor(Math.random() * max); }


/* Abre un modal que muestra un mensaje dependiendo del resultado del juego */
function mostrarMensaje(msg) {
    const modal = document.getElementById('modal-mensaje');
    document.getElementById('mensaje-contenido').innerText = msg;
    modal.classList.remove('oculto');
}

/* Cierra el modal de mensaje */
function ocultarMensaje() {
    document.getElementById('modal-mensaje').classList.add('oculto');
}

// Los event listeners se configuran al final en DOMContentLoaded

/* Variables para autenticación */
let sesionAdmin = null; // Almacena los datos de autenticación

// --- Persistencia de sesión admin ---
function guardarSesionAdmin(adminObj) {
    localStorage.setItem('sesionAdmin', JSON.stringify(adminObj));
}

function cargarSesionAdmin() {
    const data = localStorage.getItem('sesionAdmin');
    if (data) {
        try {
            sesionAdmin = JSON.parse(data);
        } catch {
            sesionAdmin = null;
        }
    }
}

function limpiarSesionAdmin() {
    localStorage.removeItem('sesionAdmin');
    sesionAdmin = null;
}

/* Variables para estadísticas */
let sesionUsuario = generarIdSesion(); // ID único para esta sesión de usuario

/* Función para generar ID único de sesión */
function generarIdSesion() {
    return 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/* Función para registrar eventos de estadísticas */
async function registrarEstadistica(tipoEvento, detalles = '') {
    try {
        const response = await fetch('/api/estadisticas/registrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tipoEvento: tipoEvento,
                detalles: detalles,
                sesionUsuario: sesionUsuario
            })
        });
        // Si el admin está logueado y la petición fue exitosa, actualizar estadísticas con un pequeño delay
        if (response.ok && sesionAdmin) {
            setTimeout(cargarEstadisticasHoy, 400);
        }
    } catch (error) {
        console.error('Error al registrar estadística:', error);
    }
}

/* Funciones para el modal de login */
function mostrarLogin() {
    const modal = document.getElementById('modal-login');
    modal.classList.remove('oculto');
    document.getElementById('username').focus();
}

function ocultarLogin() {
    document.getElementById('modal-login').classList.add('oculto');
    document.getElementById('form-login').reset();
    document.getElementById('login-error').classList.add('oculto');
}

/* Función para autenticar administrador */
async function autenticarAdmin(username, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Autenticación exitosa
            sesionAdmin = { 
                username: username, 
                adminData: data.admin,
                credentials: btoa(username + ':' + password) // Guardar para futuras peticiones autenticadas
            };
            guardarSesionAdmin(sesionAdmin); // Guardar en localStorage
            // Registrar login en bitácora
            setTimeout(() => registrarEnBitacora('Inicio de sesión', 'Administrador accedió al sistema'), 500);
            ocultarLogin();
            cargarAdministradores();
            cargarPistasDeAPI();
            return true;
        } else {
            // Error de autenticación
            document.getElementById('login-error').innerText = data.message || 'Usuario o contraseña incorrectos';
            document.getElementById('login-error').classList.remove('oculto');
            return false;
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        document.getElementById('login-error').innerText = 'Error de conexión con el servidor';
        document.getElementById('login-error').classList.remove('oculto');
        return false;
    }
}

/* Los manejadores de eventos para el login se configuran en DOMContentLoaded */

/* ========== FUNCIONES DE ADMINISTRACIÓN ========== */

/* Variables globales para administración */
let adminEditando = null;

/* Variables para edición de pistas */
let pistaEditando = null;
let modoEdicion = false;

/* Función para registrar acciones en la bitácora */
async function registrarEnBitacora(accion, detalles = '') {
    if (!sesionAdmin) return;
    
    try {
        const response = await fetch('/api/bitacora/registrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + sesionAdmin.credentials
            },
            body: JSON.stringify({
                administrador: sesionAdmin.username,
                accion: accion,
                detalles: detalles
            })
        });
        // Si estamos viendo la bitácora y la petición fue exitosa, actualizarla inmediatamente
        if (response.ok && document.getElementById('section-bitacora').classList.contains('active')) {
            cargarBitacora();
        }
    } catch (error) {
        console.error('Error al registrar en bitácora:', error);
    }
}

/* Navegación de pestañas */
function inicializarPestanas() {
    // Pestañas principales
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.onclick = () => {
            console.log('Cambiando a pestaña:', btn.dataset.tab); // Debug
            cambiarPestana(btn.dataset.tab);
        };
    });
    
    // Sub-navegación de administración
    document.querySelectorAll('.subnav-button').forEach(btn => {
        btn.onclick = () => {
            console.log('Cambiando a sección:', btn.dataset.section); // Debug
            cambiarSeccionAdmin(btn.dataset.section);
        };
    });
}

function cambiarPestana(pestana) {
    // Activar botón de pestaña
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${pestana}"]`).classList.add('active');
    
    // Mostrar contenido de pestaña
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`tab-${pestana}`).classList.add('active');
    
    // Si es la pestaña de admin, cargar datos
    if (pestana === 'admin') {
        cargarAdministradores();
    }
}

function cambiarSeccionAdmin(seccion) {
    // Activar botón de sub-navegación
    document.querySelectorAll('.subnav-button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-section="${seccion}"]`).classList.add('active');
    
    // Mostrar sección correspondiente
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(`section-${seccion}`).classList.add('active');
    
    // Cargar datos específicos de cada sección
    if (seccion === 'administradores') {
        cargarAdministradores();
    } else if (seccion === 'bitacora') {
        cargarBitacora();
        cargarFiltroAdministradores();
        // Registrar que se accedió a la bitácora
        registrarEnBitacora('Consultar bitácora', 'Accedió a la sección de bitácora del sistema');
    } else if (seccion === 'estadisticas') {
        configurarFechasPorDefecto();
        cargarEstadisticasHoy();
        // Registrar que se accedió a estadísticas
        registrarEnBitacora('Consultar estadísticas', 'Accedió a la sección de estadísticas del sistema');
    }
}

/* Funciones CRUD para administradores */
async function cargarAdministradores() {
    if (!sesionAdmin) return;
    
    try {
        const response = await fetch('/api/administradores', {
            headers: {
                'Authorization': 'Basic ' + sesionAdmin.credentials
            }
        });
        
        if (response.ok) {
            const administradores = await response.json();
            renderTablaAdministradores(administradores);
        } else {
            mostrarMensaje('Error al cargar administradores');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión al cargar administradores');
    }
}

function renderTablaAdministradores(administradores) {
    const tbody = document.querySelector('#tabla-administradores tbody');
    tbody.innerHTML = '';
    
    administradores.forEach(admin => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${admin.id}</td>
            <td>${admin.username}</td>
            <td>${admin.nombre || 'Sin nombre'}</td>
            <td>${new Date(admin.fechaCreacion).toLocaleDateString()}</td>
            <td>
                <button class="btn-accion btn-editar" onclick="editarAdministrador(${admin.id})">Editar</button>
                <button class="btn-accion btn-eliminar" onclick="eliminarAdministrador(${admin.id})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/* Modal de administrador */
function mostrarModalAdmin(admin = null) {
    adminEditando = admin;
    const modal = document.getElementById('modal-admin');
    const title = document.getElementById('admin-modal-title');
    const form = document.getElementById('form-admin');
    
    if (admin) {
        title.textContent = 'Editar Administrador';
        document.getElementById('admin-username').value = admin.username;
        document.getElementById('admin-nombre').value = admin.nombre || '';
        document.getElementById('admin-password').value = '';
        document.getElementById('admin-password').placeholder = 'Dejar vacío para no cambiar';
        document.getElementById('admin-password').required = false;
    } else {
        title.textContent = 'Nuevo Administrador';
        form.reset();
        document.getElementById('admin-password').placeholder = '';
        document.getElementById('admin-password').required = true;
    }
    
    modal.classList.remove('oculto');
    document.getElementById('admin-username').focus();
}

function ocultarModalAdmin() {
    document.getElementById('modal-admin').classList.add('oculto');
    document.getElementById('form-admin').reset();
    document.getElementById('admin-error').classList.add('oculto');
    adminEditando = null;
}

async function guardarAdministrador(datos) {
    if (!sesionAdmin) return false;
    
    try {
        let url = '/api/administradores';
        let method = 'POST';
        let propioEditado = false;
        let nuevoUsername = datos.username;
        let nuevaPassword = datos.password;

        if (adminEditando) {
            url += `/${adminEditando.id}`;
            method = 'PUT';
            // Si no se cambió la contraseña, usar la existente
            if (!datos.password) {
                datos.password = adminEditando.password;
            }
            // Detectar si el admin está editando su propio usuario
            if (sesionAdmin && adminEditando.username === sesionAdmin.username) {
                propioEditado = true;
            }
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + sesionAdmin.credentials
            },
            body: JSON.stringify(datos)
        });

        if (response.ok) {
            // Registrar acción en bitácora
            const accion = adminEditando ? 'Modificar administrador' : 'Crear administrador';
            const detalles = adminEditando ? 
                `Modificó datos del administrador: ${datos.username}` : 
                `Creó nuevo administrador: ${datos.username}`;
            registrarEnBitacora(accion, detalles);

            // Si el admin editó su propio usuario, forzar logout o re-login
            if (propioEditado) {
                // Si cambió la contraseña, las credenciales actuales ya no sirven
                // Si el username cambió, también hay que reloguear
                let cambioCredenciales = false;
                if (adminEditando.username !== nuevoUsername) cambioCredenciales = true;
                if (nuevaPassword && nuevaPassword !== adminEditando.password) cambioCredenciales = true;

                if (cambioCredenciales) {
                    mostrarMensaje('Has modificado tu propio usuario o contraseña. Por seguridad, debes volver a iniciar sesión.');
                    setTimeout(() => {
                        limpiarSesionAdmin();
                        document.getElementById('panel-configuracion').classList.add('oculto');
                        mostrarLogin();
                    }, 1800);
                }
            }
            return true;
        } else {
            const error = await response.text();
            document.getElementById('admin-error').textContent = 'Error al guardar: ' + error;
            document.getElementById('admin-error').classList.remove('oculto');
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('admin-error').textContent = 'Error de conexión';
        document.getElementById('admin-error').classList.remove('oculto');
        return false;
    }
}

async function editarAdministrador(id) {
    if (!sesionAdmin) return;
    
    try {
        const response = await fetch(`/api/administradores/${id}`, {
            headers: {
                'Authorization': 'Basic ' + sesionAdmin.credentials
            }
        });
        
        if (response.ok) {
            const admin = await response.json();
            mostrarModalAdmin(admin);
        }
    } catch (error) {
        mostrarMensaje('Error al cargar datos del administrador');
    }
}

async function eliminarAdministrador(id) {
    if (!sesionAdmin) return;
    
    if (!confirm('¿Estás seguro de eliminar este administrador?')) return;
    
    try {
        const response = await fetch(`/api/administradores/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Basic ' + sesionAdmin.credentials
            }
        });
        
        if (response.ok) {
            // Registrar eliminación en bitácora
            registrarEnBitacora('Eliminar administrador', `Eliminó administrador con ID: ${id}`);
            mostrarMensaje('Administrador eliminado exitosamente');
            setTimeout(() => {
                ocultarMensaje();
                cargarAdministradores();
            }, 1000);
        } else {
            mostrarMensaje('Error al eliminar administrador');
        }
    } catch (error) {
        mostrarMensaje('Error de conexión al eliminar');
    }
}

/* ========== FUNCIONES DE BITÁCORA ========== */

/* Cargar bitácora completa */
async function cargarBitacora() {
    if (!sesionAdmin) return;
    
    try {
        const response = await fetch('/api/bitacora', {
            headers: {
                'Authorization': 'Basic ' + sesionAdmin.credentials
            }
        });
        
        if (response.ok) {
            const bitacora = await response.json();
            renderTablaBitacora(bitacora);
        } else {
            mostrarMensaje('Error al cargar bitácora');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión al cargar bitácora');
    }
}

/* Cargar bitácora filtrada por administrador */
async function cargarBitacoraPorAdmin(username) {
    if (!sesionAdmin) return;
    
    try {
        console.log('Cargando bitácora para:', username); // Debug
        const response = await fetch(`/api/bitacora/administrador/${username}`, {
            headers: {
                'Authorization': 'Basic ' + sesionAdmin.credentials
            }
        });
        
        if (response.ok) {
            const bitacora = await response.json();
            console.log('Bitácora filtrada obtenida:', bitacora.length, 'entradas'); // Debug
            renderTablaBitacora(bitacora);
        } else {
            console.error('Error en respuesta:', response.status); // Debug
            mostrarMensaje('Error al filtrar bitácora: ' + response.status);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje('Error de conexión al filtrar bitácora');
    }
}

/* Renderizar tabla de bitácora */
function renderTablaBitacora(entradas) {
    const tbody = document.querySelector('#tabla-bitacora tbody');
    tbody.innerHTML = '';
    
    if (entradas.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4" style="text-align: center; color: #666;">No hay registros en la bitácora</td>';
        tbody.appendChild(tr);
        return;
    }
    
    entradas.forEach(entrada => {
        const tr = document.createElement('tr');
        const fecha = new Date(entrada.fecha).toLocaleString('es-ES');
        
        tr.innerHTML = `
            <td>${fecha}</td>
            <td><strong>${entrada.administrador}</strong></td>
            <td>${entrada.accion}</td>
            <td>${entrada.detalles || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

/* Cargar lista de administradores para el filtro */
async function cargarFiltroAdministradores() {
    if (!sesionAdmin) return;
    
    try {
        const response = await fetch('/api/administradores', {
            headers: {
                'Authorization': 'Basic ' + sesionAdmin.credentials
            }
        });
        
        if (response.ok) {
            const administradores = await response.json();
            const select = document.getElementById('filtro-admin');
            
            // Limpiar opciones existentes (excepto "Todos")
            const opciones = select.querySelectorAll('option:not(:first-child)');
            opciones.forEach(opcion => opcion.remove());
            
            // Agregar administradores como opciones
            administradores.forEach(admin => {
                const option = document.createElement('option');
                option.value = admin.username;
                option.textContent = `${admin.username} (${admin.nombre || 'Sin nombre'})`;
                select.appendChild(option);
            });
            
            console.log('Filtro cargado con', administradores.length, 'administradores'); // Debug
        }
    } catch (error) {
        console.error('Error al cargar administradores para filtro:', error);
    }
}

/* ========== FUNCIONES DE ESTADÍSTICAS ========== */

/* Cargar estadísticas de hoy */
async function cargarEstadisticasHoy() {
    console.log('=== cargarEstadisticasHoy iniciado ===');
    if (!sesionAdmin) {
        console.log('ERROR: No hay sesión de admin');
        return;
    }
    
    try {
        console.log('Haciendo petición a /api/estadisticas/hoy');
        const response = await fetch('/api/estadisticas/hoy', {
            headers: {
                'Authorization': 'Basic ' + sesionAdmin.credentials
            }
        });
        
        console.log('Respuesta de hoy - status:', response.status, 'ok:', response.ok);
        
        if (response.ok) {
            const estadisticas = await response.json();
            console.log('Estadísticas de hoy recibidas:', estadisticas);
            renderEstadisticas(estadisticas);
        } else {
            const errorText = await response.text();
            console.error('Error del servidor (hoy):', response.status, errorText);
            mostrarMensaje('Error al cargar estadísticas del día');
        }
    } catch (error) {
        console.error('Error en cargarEstadisticasHoy:', error);
        mostrarMensaje('Error de conexión al cargar estadísticas');
    }
}

/* Cargar estadísticas por rango de fechas */
async function cargarEstadisticasPorRango(fechaInicio, fechaFin) {
    console.log('=== cargarEstadisticasPorRango iniciado ===');
    console.log('fechaInicio:', fechaInicio, 'fechaFin:', fechaFin);
    console.log('sesionAdmin existe:', !!sesionAdmin);
    
    if (!sesionAdmin) {
        console.log('ERROR: No hay sesión de admin');
        return;
    }
    
    try {
        const inicio = new Date(fechaInicio + 'T00:00:00').toISOString();
        const fin = new Date(fechaFin + 'T23:59:59').toISOString();
        console.log('Fechas ISO - inicio:', inicio, 'fin:', fin);
        
        const url = `/api/estadisticas/rango?inicio=${inicio}&fin=${fin}`;
        console.log('URL de la petición:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': 'Basic ' + sesionAdmin.credentials
            }
        });
        
        console.log('Respuesta recibida - status:', response.status, 'ok:', response.ok);
        
        if (response.ok) {
            const estadisticas = await response.json();
            console.log('Estadísticas recibidas:', estadisticas);
            renderEstadisticas(estadisticas);
            console.log('renderEstadisticas llamado correctamente');
        } else {
            const errorText = await response.text();
            console.error('Error del servidor:', response.status, errorText);
            mostrarMensaje('Error al cargar estadísticas por rango: ' + response.status);
        }
    } catch (error) {
        console.error('Error en cargarEstadisticasPorRango:', error);
        mostrarMensaje('Error de conexión al cargar estadísticas por rango');
    }
}

/* Renderizar estadísticas en las cards */
function renderEstadisticas(stats) {
    console.log('=== renderEstadisticas iniciado ===');
    console.log('Stats recibidas:', stats);
    
    // Verificar que los elementos existen en el DOM
    const elementos = ['stat-visitantes', 'stat-visitas', 'stat-exitos', 'stat-fallos'];
    elementos.forEach(id => {
        const elemento = document.getElementById(id);
        console.log(`Elemento ${id}:`, elemento ? 'EXISTE' : 'NO EXISTE');
    });
    
    document.getElementById('stat-visitantes').textContent = stats.visitantes || 0;
    document.getElementById('stat-visitas').textContent = stats.totalVisitas || 0;
    document.getElementById('stat-exitos').textContent = stats.exitos || 0;
    document.getElementById('stat-fallos').textContent = stats.fallos || 0;
    
    console.log('Valores asignados:');
    console.log('- Visitantes:', stats.visitantes || 0);
    console.log('- Visitas:', stats.totalVisitas || 0);
    console.log('- Éxitos:', stats.exitos || 0);
    console.log('- Fallos:', stats.fallos || 0);
    
    // Calcular tasa de éxito
    const totalIntentos = (stats.exitos || 0) + (stats.fallos || 0);
    let tasaExito = 0;
    
    if (totalIntentos > 0) {
        tasaExito = Math.round((stats.exitos / totalIntentos) * 100);
    }
    
    const tasaTexto = totalIntentos > 0 ? 
        `${tasaExito}% (${stats.exitos}/${totalIntentos} intentos)` : 
        'Sin datos suficientes';
    
    const elementoTasa = document.getElementById('tasa-exito');
    console.log('Elemento tasa-exito:', elementoTasa ? 'EXISTE' : 'NO EXISTE');
    console.log('Tasa de éxito calculada:', tasaTexto);
    
    elementoTasa.textContent = tasaTexto;
    
    // Cambiar color según la tasa de éxito
    if (tasaExito >= 70) {
        elementoTasa.style.color = '#008000'; // Verde fuerte
    } else if (tasaExito >= 40) {
        elementoTasa.style.color = '#ff6600'; // Naranja fuerte
    } else {
        elementoTasa.style.color = '#d50000'; // Rojo fuerte
    }
    
    console.log('=== renderEstadisticas completado ===');
}

/* Configurar fechas por defecto (hoy) */
function configurarFechasPorDefecto() {
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];
    
    document.getElementById('fecha-inicio').value = fechaHoy;
    document.getElementById('fecha-fin').value = fechaHoy;
}

/*Tablero del juego*/
function crearTablero(pista, robotPos) {
    console.log('crearTablero llamado con pista:', pista, 'robotPos:', robotPos);
    const tablero = document.getElementById('tablero');
    if (!tablero) {
        console.error('ERROR: No se encontró el elemento tablero');
        return;
    }
    tablero.innerHTML = '';
    /* Variable para rotar el robot según su dirección */
    const angulos = [0, 90, 180, 270];

    /*Recorre el tablero y crea las celdas*/
    for (let y = 0; y < TAM; y++) {
        for (let x = 0; x < TAM; x++) {
            const celda = document.createElement('div');
            celda.className = 'celda';
            if (pista && pista.some(p => p.x === x && p.y === y)) celda.classList.add('pista');
            if (robotPos && robotPos.x === x && robotPos.y === y) {
                celda.classList.add('robot');

        /* variable constante que construye el SVG de Wall-E y lo coloca en la celda inicial*/
        const svg = `
            <svg width="70" height="70" viewBox="0 0 70 70" style="transform: rotate(${angulos[robotPos.dir]}deg);" xmlns="http://www.w3.org/2000/svg">
                <!-- Brazos extendidos hacia el frente (arriba en el SVG) -->
                <line x1="20" y1="22" x2="20" y2="2" stroke="#525353ff" stroke-width="5" stroke-linecap="round"/>
                <ellipse cx="20" cy="2" rx="3" ry="2.2" fill="#525353ff" stroke="#333" stroke-width="1"/>
                <line x1="50" y1="22" x2="50" y2="2" stroke="#525353ff" stroke-width="5" stroke-linecap="round"/>
                <ellipse cx="50" cy="2" rx="3" ry="2.2" fill="#525353ff" stroke="#333" stroke-width="1"/>
                <!-- Orugas laterales -->
                <rect x="10" y="20" width="6" height="30" rx="2" fill="#444"/>
                <rect x="54" y="20" width="6" height="30" rx="2" fill="#444"/>
                <!-- líneas de las orugas -->
                <line x1="13" y1="22" x2="13" y2="48" stroke="#222" stroke-width="1"/>
                <line x1="57" y1="22" x2="57" y2="48" stroke="#222" stroke-width="1"/>

                <!-- Cuerpo principal -->
                <rect x="16" y="18" width="38" height="34" rx="6" fill="#cea820ff" stroke="#333" stroke-width="2"/>
            
                <!-- Panel superior con rejilla -->
                <rect x="20" y="22" width="30" height="10" rx="2" fill="#e39d25ff" stroke="#333" stroke-width="1.2"/>
                <line x1="22" y1="27" x2="48" y2="27" stroke="#333" stroke-width="1"/>

                <!-- Cámaras frontales (ojos Wall-E) -->
                <ellipse cx="28" cy="18" rx="6" ry="7" fill="#fff" stroke="#333333ff" stroke-width="2"/>
                <ellipse cx="42" cy="18" rx="6" ry="7" fill="#fff" stroke="#333" stroke-width="2"/>
                <circle cx="28" cy="18" r="3" fill="#333"/>
                <circle cx="42" cy="18" r="3" fill="#333"/>

                <!-- Detalle trasero (panel energía) -->
                <rect x="26" y="42" width="18" height="6" rx="2" fill="#9ccc65" stroke="#333" stroke-width="1.2"/>

                <!-- Boca/rejilla -->
                <rect x="30" y="34" width="10" height="3" rx="1" fill="#333"/>

                <!-- Flecha de dirección integrada -->
                <polygon points="35,6 27,14 43,14" fill="#f32121ff" stroke="#333" stroke-width="0.5"/>
            </svg>`;
        celda.innerHTML = svg;
            }
        tablero.appendChild(celda);
        }
    }
    console.log('Tablero creado correctamente con', tablero.children.length, 'celdas');
}

/*Función que maneja los movimientos programados por el usuario*/
let movimientoEnCurso = -1;
function renderMovimientos() {
    const iconos = {
        'izquierda': `<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="15" fill="#cddc39" stroke="#333" stroke-width="2"/><polygon points="20,8 8,16 20,24" fill="#333"/></svg>`,
        'derecha': `<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="15" fill="#ffb300" stroke="#333" stroke-width="2"/><polygon points="12,8 24,16 12,24" fill="#333"/></svg>`,
        'adelante': `<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="15" fill="#2196f3" stroke="#333" stroke-width="2"/><polygon points="8,20 16,8 24,20" fill="#fff"/></svg>`,
        'bucle': `<svg width="22" height="22" viewBox="0 0 32 32"><g><path d="M8 16a8 8 0 0 1 8-8c2.5 0 4.7 1.1 6.2 2.8" fill="none" stroke="#f44336" stroke-width="3"/><polygon points="20,4 24,8 18,8" fill="#f44336"/></g><g><path d="M24 16a8 8 0 0 1-8 8c-2.5 0-4.7-1.1-6.2-2.8" fill="none" stroke="#f44336" stroke-width="3"/><polygon points="12,28 8,24 14,24" fill="#f44336"/></g></svg>`,
        'inicia bucle': `<svg width="22" height="22" viewBox="0 0 32 32"><g><path d="M8 16a8 8 0 0 1 8-8c2.5 0 4.7 1.1 6.2 2.8" fill="none" stroke="#f44336" stroke-width="3"/><polygon points="20,4 24,8 18,8" fill="#f44336"/></g><g><path d="M24 16a8 8 0 0 1-8 8c-2.5 0-4.7-1.1-6.2-2.8" fill="none" stroke="#f44336" stroke-width="3"/><polygon points="12,28 8,24 14,24" fill="#f44336"/></g></svg>`,
        'finaliza bucle': `<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="15" fill="#90a4ae" stroke="#333" stroke-width="2"/><rect x="12" y="12" width="8" height="8" rx="2" fill="#333"/></svg>`
    };
    const lista = document.getElementById('lista-movimientos');
    lista.innerHTML = '';
    let liRefs = [];
    movimientos.forEach((mov, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `${iconos[mov] || ''} <span>${mov.charAt(0).toUpperCase() + mov.slice(1)}</span>`;
        if (idx === movimientoEnCurso) li.classList.add('movimiento-actual');
        lista.appendChild(li);
        liRefs.push(li);
    });
    // Forzar scroll para que el movimiento en curso esté visible
    if (movimientoEnCurso >= 0 && liRefs[movimientoEnCurso]) {
        liRefs[movimientoEnCurso].scrollIntoView({ behavior: 'auto', block: 'center' });
    } else if (liRefs.length > 0) {
        // Si no hay movimiento en curso (al ingresar), mostrar el último
        liRefs[liRefs.length - 1].scrollIntoView({ behavior: 'auto', block: 'center' });
    }
}

/* Funciones para manejar pistas con API REST */
async function cargarPistasDeAPI() {
    try {
        // Intentar cargar pistas sin autenticación (acceso público)
        let response = await fetch('/api/pistas');
        
        // Si no funciona sin autenticación y hay admin logueado, usar credenciales
        if (!response.ok && sesionAdmin) {
            response = await fetch('/api/pistas', {
                headers: {
                    'Authorization': 'Basic ' + sesionAdmin.credentials
                }
            });
        }
        
        if (response.ok) {
            const pistas = await response.json();
            pistasGuardadas = pistas.map(p => ({
                id: p.id,
                nombre: p.nombre,
                ruta: JSON.parse(p.rutaJson),
                fechaCreacion: p.fechaCreacion,
                creadaPor: p.creadaPor
            }));
        } else {
            pistasGuardadas = [];
        }
    } catch (error) {
        console.error('Error al cargar pistas de la API:', error);
        pistasGuardadas = [];
    }
}

async function guardarPistaEnAPI(nombre, ruta, esEdicion = false, pistaId = null) {
    if (!sesionAdmin) return false;
    
    try {
        const pistaData = {
            nombre: nombre,
            rutaJson: JSON.stringify(ruta),
            creadaPor: sesionAdmin.username
        };
        
        let url = '/api/pistas';
        let method = 'POST';
        
        if (esEdicion && pistaId) {
            url += `/${pistaId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + sesionAdmin.credentials
            },
            body: JSON.stringify(pistaData)
        });
        
        if (response.ok) {
            // Registrar en bitácora
            const accion = esEdicion ? 'Modificar pista' : 'Crear pista';
            const detalles = esEdicion ? 
                `Modificó la pista: ${nombre}` : 
                `Creó nueva pista: ${nombre}`;
            registrarEnBitacora(accion, detalles);
            
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error al guardar pista:', error);
        return false;
    }
}

async function eliminarPistaDeAPI(pistaId) {
    if (!sesionAdmin) return false;
    
    try {
        const response = await fetch(`/api/pistas/${pistaId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Basic ' + sesionAdmin.credentials
            }
        });
        
        if (response.ok) {
            registrarEnBitacora('Eliminar pista', `Eliminó pista con ID: ${pistaId}`);
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error al eliminar pista:', error);
        return false;
    }
}

/* Funciones para gestión de estados de botones */
function actualizarEstadoBotones() {
    const guardarCambiosBtn = document.getElementById('guardar-cambios');
    const cancelarBtn = document.getElementById('cancelar-edicion');
    const guardarBtn = document.getElementById('guardar-pista');
    
    if (!cancelarBtn || !guardarBtn) return; // Elementos no disponibles aún
    
    if (modoEdicion) {
        // En modo edición
        if (guardarCambiosBtn) {
            guardarCambiosBtn.style.display = 'inline-block';
            guardarCambiosBtn.disabled = false;
        }
        cancelarBtn.disabled = false;
        guardarBtn.disabled = true; // No se puede guardar nueva mientras se edita
        guardarBtn.textContent = 'Guardar Nueva (Editando...)';
    } else {
        // Fuera de modo edición
        if (guardarCambiosBtn) {
            guardarCambiosBtn.style.display = 'none';
        }
        cancelarBtn.disabled = true;
        guardarBtn.disabled = false;
        guardarBtn.textContent = 'Guardar Nueva';
    }
}

/* Funciones para el modo de edición de pistas */
function iniciarEdicionPista(pista, indice) {
    modoEdicion = true;
    pistaEditando = { ...pista, indice: indice };
    
    // Cargar la pista en el tablero de configuración
    configPista = JSON.parse(JSON.stringify(pista.ruta));
    renderConfigTablero();
    
    // Actualizar estado de botones
    actualizarEstadoBotones();
    
    // Mostrar mensaje informativo
    mostrarMensaje(`Editando: ${pista.nombre}. Modifica el tablero y haz clic en "Guardar Cambios".`);
    setTimeout(ocultarMensaje, 3000);
}

function cancelarEdicionPista(mostrarMensajeCancelacion = true) {
    modoEdicion = false;
    pistaEditando = null;
    configPista = [];
    
    // Limpiar selecciones
    document.querySelectorAll('#lista-pistas li').forEach(el => el.classList.remove('seleccionada'));
    renderConfigTablero();
    
    // Actualizar estado de botones
    actualizarEstadoBotones();
    
    if (mostrarMensajeCancelacion) {
        mostrarMensaje('Edición cancelada');
        setTimeout(ocultarMensaje, 2000);
    }
}

/* Carga una pista aleatoria desde el backend */
async function cargarPistaAleatoria() {
    console.log('=== INICIANDO cargarPistaAleatoria ===');
    
    // Siempre intentar cargar pistas de la API
    await cargarPistasDeAPI();
    console.log('Después de cargarPistasDeAPI, pistasGuardadas.length:', pistasGuardadas.length);
    
    if (pistasGuardadas.length > 0) {
        // Seleccionar pista aleatoria del backend
        const idx = randomInt(pistasGuardadas.length);
        console.log('Pista seleccionada índice:', idx, 'de', pistasGuardadas.length);
        const pistaSeleccionada = pistasGuardadas[idx];
        console.log('Pista seleccionada:', pistaSeleccionada.nombre);
        
        pistaActual = JSON.parse(JSON.stringify(pistaSeleccionada.ruta));
        
        // Verificar que la pista tenga al menos una celda
        if (!pistaActual || pistaActual.length === 0) {
            console.error('La pista seleccionada está vacía');
            mostrarMensaje('Error: La pista seleccionada está vacía. Contacta al administrador.');
            pistaActual = [];
            robot = { x: 0, y: 0, dir: 0 };
            crearTablero([], robot);
            renderMovimientos();
            return;
        }
        
        // Iniciar en la PRIMERA posición (la primera que se creó)
        robot = { x: pistaActual[0].x, y: pistaActual[0].y, dir: 0 };
        console.log('pistaActual configurada:', pistaActual);
        console.log('robot configurado en primera posición:', robot);
    } else {
        // Si no hay pistas en el backend, mostrar mensaje de error
        console.error('No hay pistas disponibles en el backend');
        mostrarMensaje('No hay pistas disponibles. Contacta al administrador para cargar pistas.');
        
        // Crear tablero vacío para mostrar el error
        pistaActual = [];
        robot = { x: 0, y: 0, dir: 0 };
        crearTablero([], robot);
        renderMovimientos();
        return;
    }
    
    movimientos = [];
    console.log('Llamando a crearTablero...');
    crearTablero(pistaActual, robot);
    console.log('Llamando a renderMovimientos...');
    renderMovimientos();
    console.log('=== TERMINANDO cargarPistaAleatoria ===');
}

/* Función que ejecuta los movimientos programados del robot */
async function ejecutarMovimientos() {
    let x = robot.x, y = robot.y, dir = robot.dir;
    let error = false;
    let i = 0;
    function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }
    async function mover(mov, idxMov) {
        movimientoEnCurso = idxMov;
        renderMovimientos();
        if (mov === 'adelante') {
            let nx = x, ny = y;
            if (dir === 0) ny--;
            if (dir === 1) nx++;
            if (dir === 2) ny++;
            if (dir === 3) nx--;
            if (!pistaActual.some(p => p.x === nx && p.y === ny)) {
                x = nx; y = ny;
                // Actualiza el tablero para mostrar el error
                crearTablero(pistaActual, {x, y, dir});
                await sleep(400);
                error = true;
                return;
            }
            x = nx; y = ny;
        } else if (mov === 'izquierda') {
            dir = (dir + 3) % 4;
        } else if (mov === 'derecha') {
            dir = (dir + 1) % 4;
        }
        // Actualiza el tablero después de cada movimiento
    crearTablero(pistaActual, {x, y, dir});
    await sleep(700);
    }
    async function ejecutarSecuencia(movs, offset = 0) {
        for (let j = 0; j < movs.length; j++) {
            if (movs[j] === 'inicia bucle') {
                let bucle = [];
                let bucleStart = j;
                j++;
                while (j < movs.length && movs[j] !== 'finaliza bucle') {
                    bucle.push(movs[j]);
                    j++;
                }
                for (let k = 0; k < bucle.length; k++) {
                    await mover(bucle[k], offset + bucleStart + 1 + k);
                    if (error) return;
                }
            } else {
                await mover(movs[j], offset + j);
                if (error) return;
            }
        }
    }
    await ejecutarSecuencia(movimientos);
    movimientoEnCurso = -1;
    renderMovimientos();
    if (error) {
        document.querySelectorAll('.celda').forEach((c, idx) => {
            let cx = idx % TAM, cy = Math.floor(idx / TAM);
            if (cx === x && cy === y) c.classList.add('error');
        });
        registrarEstadistica('fallo', 'Usuario salió de la pista durante la ejecución');
        mostrarMensaje('Te equivocaste en tu movimiento, inténtalo de nuevo');
    } else if (x === pistaActual[pistaActual.length-1].x && y === pistaActual[pistaActual.length-1].y) {
        registrarEstadistica('exito', 'Usuario completó exitosamente la misión');
        mostrarMensaje('¡Felicitaciones, misión cumplida!');
    } else {
        registrarEstadistica('fallo', 'Usuario no completó el recorrido completo');
        mostrarMensaje('No completaste el recorrido, agrega todos los movimientos necesarios para llegar al final.');
    }
}

// Maneja los eventos de los botones de movimiento
document.querySelectorAll('.btn-mov').forEach(btn => {
    btn.onclick = () => {
        const mov = btn.dataset.mov;
        if (mov === 'bucle') {
            movimientos.push('inicia bucle');
            movimientos.push('adelante');
            movimientos.push('finaliza bucle');
        } else {
            movimientos.push(mov);
        }
        renderMovimientos();
    };
});

// Los event listeners principales se configuran en DOMContentLoaded

/* Panel de configuración de las pistas */
let configPista = [];
function renderConfigTablero() {
    const tablero = document.getElementById('config-tablero');
    tablero.innerHTML = '';
    for (let y = 0; y < TAM; y++) {
        for (let x = 0; x < TAM; x++) {
            const celda = document.createElement('div');
            celda.className = 'celda';
            if (configPista.some(p => p.x === x && p.y === y)) celda.classList.add('pista');
            celda.onclick = () => {
                const idx = configPista.findIndex(p => p.x === x && p.y === y);
                if (idx >= 0) configPista.splice(idx, 1);
                else configPista.push({x, y});
                renderConfigTablero();
            };
            tablero.appendChild(celda);
        }
    }
}

/* Maneja los eventos de guardar, borrar, cargar y exportar pistas */
// El event listener de guardar-pista se configura en DOMContentLoaded

/* Borrar la pista seleccionada - ELIMINADO: Ahora se maneja con botones individuales */
// El botón borrar-pista ya no existe, se reemplazó por botones individuales en cada pista

/* función que permite cargar la lista de pistas guardadas */
async function renderListaPistas() {
    await cargarPistasDeAPI();
    const lista = document.getElementById('lista-pistas');
    lista.innerHTML = '';
    
    pistasGuardadas.forEach((p, i) => {
        const li = document.createElement('li');
        const fechaCreacion = p.fechaCreacion ? 
            new Date(p.fechaCreacion).toLocaleDateString() : '';
        const creadaPor = p.creadaPor ? ` (por ${p.creadaPor})` : '';
        
        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1; margin-right: 10px;">
                    <strong>${p.nombre || ('Pista ' + (i+1))}</strong>
                    <br><small>${fechaCreacion}${creadaPor}</small>
                </div>
                <div style="display: flex; flex-direction: column; gap: 3px; min-width: 60px;">
                    <button class="btn-editar-pista" data-idx="${i}">✏️ Editar</button>
                    <button class="btn-borrar-pista" data-idx="${i}" data-pista-id="${p.id}">🗑️ Borrar</button>
                </div>
            </div>
        `;
        
        li.dataset.idx = i;
        li.dataset.pistaId = p.id; // Guardar ID de la pista para eliminación
        
        li.onclick = (e) => {
            // No activar selección si se hizo clic en los botones
            if (e.target.classList.contains('btn-editar-pista') || 
                e.target.classList.contains('btn-borrar-pista')) return;
            
            document.querySelectorAll('#lista-pistas li').forEach(el => el.classList.remove('seleccionada'));
            li.classList.add('seleccionada');
            
            // Actualizar estado de botones cuando se selecciona una pista
            actualizarEstadoBotones();
            
            if (!modoEdicion) {
                configPista = JSON.parse(JSON.stringify(p.ruta));
                renderConfigTablero();
            }
        };
        
        // Event listener para el botón de editar individual
        const btnEditar = li.querySelector('.btn-editar-pista');
        btnEditar.onclick = (e) => {
            e.stopPropagation();
            iniciarEdicionPista(p, i);
            document.querySelectorAll('#lista-pistas li').forEach(el => el.classList.remove('seleccionada'));
            li.classList.add('seleccionada');
        };
        
        // Event listener para el botón de borrar individual
        const btnBorrar = li.querySelector('.btn-borrar-pista');
        btnBorrar.onclick = async (e) => {
            e.stopPropagation();
            if (confirm(`¿Estás seguro de que quieres eliminar la pista "${p.nombre || ('Pista ' + (i+1))}"?`)) {
                const exitoso = await eliminarPistaDeAPI(p.id);
                if (exitoso) {
                    // Limpiar el tablero de configuración
                    configPista = [];
                    renderConfigTablero();
                    
                    // Si estaba editando esta pista, cancelar edición
                    if (modoEdicion && pistaEditando && pistaEditando.id === p.id) {
                        cancelarEdicionPista(false); // No mostrar mensaje al eliminar la pista editada
                    }
                    
                    await renderListaPistas(); // Recargar lista después de eliminar
                    actualizarEstadoBotones(); // Actualizar estado de botones
                    mostrarMensaje('Pista eliminada correctamente');
                    setTimeout(ocultarMensaje, 2000);
                }
            }
        };
        
        lista.appendChild(li);
    });
    
    // Actualizar estado de botones después de renderizar
    actualizarEstadoBotones();
}

/* Cargar y exportar pistas en formato JSON - COMENTADO PARA MOVER A DOMContentLoaded */
/*
document.getElementById('cargar-archivo').onclick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => {
            try {
                const data = JSON.parse(evt.target.result);
                if (Array.isArray(data)) {
                    pistasGuardadas.push({ nombre: 'Pista importada', ruta: data });
                    guardarPistasEnStorage();
                    renderListaPistas();
                    mostrarMensaje('Pista cargada');
                }
            } catch {
                mostrarMensaje('Archivo inválido');
            }
        };
        reader.readAsText(file);
    };
    input.click();
};
document.getElementById('exportar-archivo').onclick = () => {
    if (configPista.length === 0) return mostrarMensaje('No hay pista para exportar');
    const blob = new Blob([JSON.stringify(configPista)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pista.json';
    a.click();
};
*/

/* Función para cerrar sesión */
function cerrarSesion() {
    if (confirm('¿Estás seguro de que deseas cerrar la sesión?')) {
        // Registrar cierre de sesión antes de limpiar la sesión
        registrarEnBitacora('Cierre de sesión', 'Administrador cerró sesión');
        setTimeout(() => {
            limpiarSesionAdmin();
            document.getElementById('panel-configuracion').classList.add('oculto');
            mostrarMensaje('Sesión cerrada exitosamente');
            setTimeout(ocultarMensaje, 2000);
        }, 200);
    }
}

/* Los event listeners se configuran en DOMContentLoaded */

/* Los event listeners específicos se configuran en DOMContentLoaded */

/* Función para configurar todos los event listeners */
function configurarEventListeners() {
    console.log('Configurando event listeners...');
    
    // Event listeners básicos
    const cerrarMensaje = document.getElementById('cerrar-mensaje');
    if (cerrarMensaje) cerrarMensaje.onclick = ocultarMensaje;
    
    // Event listeners para login
    const cerrarLogin = document.getElementById('cerrar-login');
    if (cerrarLogin) cerrarLogin.onclick = ocultarLogin;

    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.onsubmit = async function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const exitoso = await autenticarAdmin(username, password);
            if (exitoso) {
                mostrarMensaje('Login exitoso. Accediendo al menú de administración...');
                setTimeout(async () => {
                    ocultarMensaje();
                    document.getElementById('panel-configuracion').classList.remove('oculto');
                    // Mostrar la pestaña de administración por defecto
                    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                    document.querySelector('[data-tab="admin"]').classList.add('active');
                    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                    document.getElementById('tab-admin').classList.add('active');
                    inicializarPestanas();
                }, 1000);
            }
        };
    }

    // Event listener para submit de form-admin (crear/editar admin)
    const formAdmin = document.getElementById('form-admin');
    if (formAdmin) {
        formAdmin.onsubmit = async function(e) {
            e.preventDefault();
            // Ocultar error anterior
            document.getElementById('admin-error').classList.add('oculto');
            // Obtener datos
            const username = document.getElementById('admin-username').value.trim();
            const nombre = document.getElementById('admin-nombre').value.trim();
            const password = document.getElementById('admin-password').value;
            // Validación básica
            if (!username || !nombre || (!adminEditando && !password)) {
                document.getElementById('admin-error').textContent = 'Completa todos los campos obligatorios';
                document.getElementById('admin-error').classList.remove('oculto');
                return;
            }
            // Construir objeto datos
            const datos = { username, nombre };
            if (password) datos.password = password;
            // Guardar
            const exitoso = await guardarAdministrador(datos);
            if (exitoso) {
                ocultarModalAdmin();
                await cargarAdministradores();
                mostrarMensaje('Administrador creado correctamente');
                setTimeout(ocultarMensaje, 2000);
            }
            // Si hay error, se muestra desde guardarAdministrador
        };
    }
    
    // Event listeners principales del juego
    const ejecutar = document.getElementById('ejecutar');
    if (ejecutar) ejecutar.onclick = ejecutarMovimientos;
    
    const reiniciar = document.getElementById('reiniciar');
    if (reiniciar) {
        reiniciar.onclick = async () => {
            await cargarPistaAleatoria();
            if (pistaActual && pistaActual.length > 0) {
                robot = { x: pistaActual[0].x, y: pistaActual[0].y, dir: 0 };
                crearTablero(pistaActual, robot);
            }
        };
    }
    
    const configurar = document.getElementById('configurar');
    if (configurar) {
        configurar.onclick = () => {
            if (sesionAdmin) {
                document.getElementById('panel-configuracion').classList.remove('oculto');
                renderConfigTablero();
                renderListaPistas();
                inicializarPestanas();
            } else {
                mostrarLogin();
            }
        };
    }
    
    const cerrarConfig = document.getElementById('cerrar-config');
    if (cerrarConfig) {
        cerrarConfig.onclick = () => {
            document.getElementById('panel-configuracion').classList.add('oculto');
        };
    }
    
    // Event listeners para pistas
    const guardarPista = document.getElementById('guardar-pista');
    if (guardarPista) {
        guardarPista.onclick = async () => {
            if (modoEdicion) {
                return mostrarMensaje('No puedes guardar una nueva pista mientras estás editando. Termina la edición primero.');
            }
            if (configPista.length === 0) return mostrarMensaje('Selecciona al menos una celda');
            if (!sesionAdmin) return mostrarMensaje('Debes estar autenticado para guardar pistas');
            const nombre = prompt('Nombre de la pista:');
            if (!nombre) return;
            const exitoso = await guardarPistaEnAPI(nombre, configPista);
            if (exitoso) {
                await renderListaPistas();
                // Actualizar el tablero del juego con una nueva pista aleatoria
                await cargarPistaAleatoria();
                mostrarMensaje('Pista guardada exitosamente y tablero actualizado');
            } else {
                mostrarMensaje('Error al guardar la pista');
            }
        };
    }

    // Botón regresar al menú admin desde pistas
    const btnRegresarAdmin = document.getElementById('btn-regresar-admin');
    if (btnRegresarAdmin) {
        btnRegresarAdmin.onclick = () => {
            // Cambiar a la pestaña de administración
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelector('[data-tab="admin"]').classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById('tab-admin').classList.add('active');
        };
    }
    
    // Event listeners de movimientos
    document.querySelectorAll('.btn-mov').forEach(btn => {
        btn.onclick = () => {
            const mov = btn.dataset.mov;
            if (mov === 'bucle') {
                movimientos.push('inicia bucle');
                movimientos.push('adelante');
                movimientos.push('finaliza bucle');
            } else {
                movimientos.push(mov);
            }
            renderMovimientos();
        };
    });
    
    // Event listeners para cargar y exportar archivos
    const cargarArchivo = document.getElementById('cargar-archivo');
    if (cargarArchivo) {
        cargarArchivo.onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async evt => {
                    try {
                        const data = JSON.parse(evt.target.result);
                        if (Array.isArray(data) && data.length > 0) {
                            // Verificar que los datos tengan la estructura correcta
                            if (data.every(p => typeof p.x === 'number' && typeof p.y === 'number')) {
                                // Si hay admin logueado, guardar en la API
                                if (sesionAdmin) {
                                    const nombrePista = prompt('Nombre para la pista importada:', 'Pista importada');
                                    if (nombrePista) {
                                        const exitoso = await guardarPistaEnAPI(nombrePista, data);
                                        if (exitoso) {
                                            await renderListaPistas();
                                            mostrarMensaje('Pista cargada y guardada en el servidor');
                                        } else {
                                            mostrarMensaje('Error al guardar la pista en el servidor');
                                        }
                                    }
                                } else {
                                    mostrarMensaje('Debes iniciar sesión como administrador para importar pistas');
                                }
                                // Cargar la pista importada al tablero principal (juego)
                                configPista = JSON.parse(JSON.stringify(data));
                                pistaActual = JSON.parse(JSON.stringify(data));
                                crearTablero(pistaActual, robot); // robot es la posición actual del robot
                            } else {
                                mostrarMensaje('Archivo inválido: formato de pista incorrecto');
                            }
                        } else {
                            mostrarMensaje('Archivo inválido: debe contener un array de posiciones');
                        }
                    } catch (error) {
                        console.error('Error al parsear archivo:', error);
                        mostrarMensaje('Archivo inválido: no es un JSON válido');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        };
    }
    
    const exportarArchivo = document.getElementById('exportar-archivo');
    if (exportarArchivo) {
        exportarArchivo.onclick = () => {
            if (configPista.length === 0) return mostrarMensaje('No hay pista para exportar');
            const blob = new Blob([JSON.stringify(configPista)], {type:'application/json'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'pista.json';
            a.click();
        };
    }
    
    // Event listener para guardar cambios durante edición
    const guardarCambios = document.getElementById('guardar-cambios');
    if (guardarCambios) {
        guardarCambios.onclick = async () => {
            if (modoEdicion && pistaEditando) {
                // Guardar cambios
                if (configPista.length === 0) {
                    return mostrarMensaje('No hay pista para guardar');
                }
                
                const exitoso = await guardarPistaEnAPI(pistaEditando.nombre, configPista, true, pistaEditando.id);
                if (exitoso) {
                    mostrarMensaje('Pista actualizada exitosamente');
                    cancelarEdicionPista(false); // No mostrar mensaje de cancelación al guardar
                    await renderListaPistas();
                    // Actualizar el tablero del juego con una nueva pista aleatoria
                    await cargarPistaAleatoria();
                } else {
                    mostrarMensaje('Error al actualizar la pista');
                }
            }
        };
    }
    
    const cancelarEdicion = document.getElementById('cancelar-edicion');
    if (cancelarEdicion) {
        cancelarEdicion.onclick = () => {
            if (modoEdicion) {
                cancelarEdicionPista(true); // Sí mostrar mensaje al cancelar manualmente
            }
        };
    }
    
    // Event listener para cerrar sesión
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.onclick = cerrarSesion;
    }
    
    // Event listeners para filtros de bitácora
    const btnFiltrarBitacora = document.getElementById('btn-filtrar-bitacora');
    if (btnFiltrarBitacora) {
        btnFiltrarBitacora.onclick = () => {
            const adminSeleccionado = document.getElementById('filtro-admin').value;
            if (adminSeleccionado) {
                cargarBitacoraPorAdmin(adminSeleccionado);
            } else {
                cargarBitacora(); // Si no hay admin seleccionado, mostrar todos
            }
        };
    }
    
    const btnLimpiarFiltro = document.getElementById('btn-limpiar-filtro');
    if (btnLimpiarFiltro) {
        btnLimpiarFiltro.onclick = () => {
            document.getElementById('filtro-admin').value = '';
            cargarBitacora(); // Mostrar todos los registros
        };
    }
    
    const btnActualizarBitacora = document.getElementById('btn-actualizar-bitacora');
    if (btnActualizarBitacora) {
        btnActualizarBitacora.onclick = () => {
            const adminSeleccionado = document.getElementById('filtro-admin').value;
            if (adminSeleccionado) {
                cargarBitacoraPorAdmin(adminSeleccionado);
            } else {
                cargarBitacora();
            }
        };
    }
    
    // Event listeners para formularios de administrador
    // Declaración única de formLogin al inicio de la función
    if (formLogin) {
        formLogin.onsubmit = async function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const exitoso = await autenticarAdmin(username, password);
            if (exitoso) {
                mostrarMensaje('Login exitoso. Accediendo al menú de administración...');
                setTimeout(async () => {
                    ocultarMensaje();
                    document.getElementById('panel-configuracion').classList.remove('oculto');
                    // Mostrar la pestaña de administración por defecto
                    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                    document.querySelector('[data-tab="admin"]').classList.add('active');
                    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                    document.getElementById('tab-admin').classList.add('active');
                    inicializarPestanas();
                }, 1000);
            }
        };
    }
    // Event listeners para botones de modal administrador
    const btnNuevoAdmin = document.getElementById('btn-nuevo-admin');
    if (btnNuevoAdmin) {
        btnNuevoAdmin.onclick = () => mostrarModalAdmin();
    }
    
    const btnCerrarAdmin = document.getElementById('cerrar-admin');
    if (btnCerrarAdmin) {
        btnCerrarAdmin.onclick = ocultarModalAdmin;
    }
    
    // Event listeners para estadísticas
    const btnFiltrarEstadisticas = document.getElementById('btn-filtrar-estadisticas');
    if (btnFiltrarEstadisticas) {
        btnFiltrarEstadisticas.onclick = () => {
            console.log('Botón consultar estadísticas clickeado'); // Debug
            const fechaInicio = document.getElementById('fecha-inicio').value;
            const fechaFin = document.getElementById('fecha-fin').value;
            
            console.log('Fecha inicio:', fechaInicio, 'Fecha fin:', fechaFin); // Debug
            
            if (fechaInicio && fechaFin) {
                console.log('Cargando estadísticas por rango...'); // Debug
                cargarEstadisticasPorRango(fechaInicio, fechaFin);
            } else {
                mostrarMensaje('Por favor selecciona las fechas de inicio y fin');
            }
        };
    }
    
    const btnEstadisticasHoy = document.getElementById('btn-estadisticas-hoy');
    if (btnEstadisticasHoy) {
        btnEstadisticasHoy.onclick = () => {
            // Establecer la fecha de hoy en ambos campos y mostrar estadísticas de hoy
            const hoy = new Date();
            const fechaHoy = hoy.toISOString().split('T')[0];
            document.getElementById('fecha-inicio').value = fechaHoy;
            document.getElementById('fecha-fin').value = fechaHoy;
            cargarEstadisticasHoy();
        };
    }
    
    console.log('Event listeners configurados correctamente');
}

/* Inicialización al cargar la página */
document.addEventListener('DOMContentLoaded', async function() {
    // Restaurar sesión admin si existe
    cargarSesionAdmin();
    console.log('INICIANDO INICIALIZACIÓN DE LA PÁGINA - DOM CARGADO');
    try {
        // Primero configurar event listeners
        configurarEventListeners();
        
        console.log('Llamando a cargarPistaAleatoria...');
        await cargarPistaAleatoria();
        console.log('cargarPistaAleatoria completada');
        
        /* Registrar visita al cargar la página */
        registrarEstadistica('visita', 'Usuario accedió al juego');
        
        /* Inicializar estado de botones después de cargar */
        setTimeout(() => {
            actualizarEstadoBotones();
            console.log('INICIALIZACIÓN COMPLETADA EXITOSAMENTE');
        }, 100);
        // Si hay sesión admin, ir directo a admin
        if (sesionAdmin) {
            cambiarPestana('admin');
        }
    } catch (error) {
        console.error('ERROR EN INICIALIZACIÓN:', error);
        // Fallback de emergencia - mostrar mensaje de error
        console.log('Error crítico en inicialización');
        mostrarMensaje('Error al cargar el juego. Contacta al administrador para verificar que haya pistas disponibles en el sistema.');
        
        // Crear tablero vacío para mostrar el estado de error
        pistaActual = [];
        robot = { x: 0, y: 0, dir: 0 };
        movimientos = [];
        crearTablero([], robot);
        renderMovimientos();
    }
});
