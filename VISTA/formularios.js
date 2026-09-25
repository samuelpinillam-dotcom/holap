/* ============================================================
   DELPINWARE — Lógica de formularios (v2)
   ✏️ La tarjeta ya NO redirige sola al voltear (te da tiempo de
   usar la cara trasera). Nuevos campos en registro: teléfono,
   fecha de nacimiento y términos, con sus validaciones.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    const tarjeta = document.getElementById('tarjeta3d');

    /* ---------- Utilidades de validación ---------- */
    const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const REGEX_TEL   = /^\d{7,15}$/;   // 7 a 15 dígitos
    const EDAD_MINIMA = 13;             // cámbiala si tu profe pide otra

    const REQUISITOS = {
        largo:   v => v.length >= 8,
        mayus:   v => /[A-Z]/.test(v),
        numero:  v => /\d/.test(v),
        simbolo: v => /[^A-Za-z0-9]/.test(v)
    };

    function obtenerPuntaje(v) {
        return Object.values(REQUISITOS).filter(fn => fn(v)).length;
    }

    // Calcula la edad a partir de una fecha "YYYY-MM-DD"
    function calcularEdad(fecha) {
        const hoy = new Date();
        const nac = new Date(fecha + 'T00:00:00');
        let edad = hoy.getFullYear() - nac.getFullYear();
        const m = hoy.getMonth() - nac.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
        return edad;
    }

    function ponerError(grupoId, errorId, mensaje) {
        document.getElementById(grupoId).classList.add('error');
        document.getElementById(errorId).textContent = mensaje;
    }

    function limpiarErrores(form) {
        form.querySelectorAll('.input-grupo, .terminos').forEach(g => g.classList.remove('error'));
        form.querySelectorAll('.msg-error').forEach(m => m.textContent = '');
    }

    function temblar() {
        tarjeta.classList.add('temblor');
        setTimeout(() => tarjeta.classList.remove('temblor'), 500);
    }

    function activarCarga(btn, textoCarga) {
        btn.disabled = true;
        btn.querySelector('.btn-texto').textContent = textoCarga;
        btn.querySelector('.spinner').hidden = false;
    }

    function desactivarCarga(btn, textoNormal) {
        btn.disabled = false;
        btn.querySelector('.btn-texto').textContent = textoNormal;
        btn.querySelector('.spinner').hidden = true;
    }

    let toastTimer;
    function mostrarToast(mensaje, tipo = 'exito') {
        const toast = document.getElementById('toast');
        toast.textContent = mensaje;
        toast.className = 'toast ' + tipo;
        void toast.offsetWidth;
        toast.classList.add('visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
    }

    /* ---------- 1. OJITO ---------- */
    document.querySelectorAll('.btn-ojo').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            const ver = input.type === 'password';
            input.type = ver ? 'text' : 'password';
            btn.classList.toggle('mostrando', ver);
        });
    });

    /* ---------- 2. TARJETA GIRATORIA (✏️ CAMBIO) ----------
       Antes: volteaba y te redirigía sola a los 650ms.
       Ahora: SOLO voltea y se queda ahí, para que tengas tiempo
       de leer la cara trasera y elegir con calma. */
    document.querySelectorAll('.flip-link').forEach(enlace => {
        enlace.addEventListener('click', e => {
            e.preventDefault();
            tarjeta.classList.add('volteada');
        });
    });

    // Botón "← Volver" de la cara trasera (desvoltea)
    document.querySelectorAll('.flip-back').forEach(enlace => {
        enlace.addEventListener('click', e => {
            e.preventDefault();
            tarjeta.classList.remove('volteada');
        });
    });

    /* ---------- 3. Link de términos ----------
       Evita que el clic en el enlace marque el checkbox. */
    document.querySelectorAll('.link-terminos').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    /* ---------- 4. REGISTRO: fuerza + checklist en vivo ---------- */
    const pass = document.getElementById('regPass');
    if (pass) {
        const relleno = document.getElementById('fuerzaRelleno');
        const texto   = document.getElementById('fuerzaTexto');
        const wrap    = document.getElementById('fuerzaWrap');
        const checks  = document.querySelectorAll('#checklist li');

        const NIVELES = [
            { color: '#ef4444', texto: '' },
            { color: '#ef4444', texto: 'Muy débil' },
            { color: '#f59e0b', texto: 'Débil' },
            { color: '#eab308', texto: 'Media' },
            { color: '#22c55e', texto: '¡Muy fuerte!' }
        ];

        pass.addEventListener('input', () => {
            const v = pass.value;
            wrap.hidden = v.length === 0;
            checks.forEach(li => li.classList.toggle('ok', REQUISITOS[li.dataset.req](v)));
            const puntaje = obtenerPuntaje(v);
            const nivel = NIVELES[puntaje];
            relleno.style.width = (puntaje * 25) + '%';
            relleno.style.backgroundColor = nivel.color;
            texto.textContent = nivel.texto;
            texto.style.color = nivel.texto ? nivel.color : 'rgba(255,255,255,.6)';
        });
    }

    /* ---------- 5. ENVÍO — INICIAR SESIÓN ---------- */
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', e => {
            e.preventDefault();
            limpiarErrores(formLogin);

            const email = document.getElementById('loginEmail').value.trim();
            const passL = document.getElementById('loginPass').value;
            let valido = true;

            if (!email) {
                ponerError('grupoEmail', 'errorEmail', 'Escribe tu correo.');
                valido = false;
            } else if (!REGEX_EMAIL.test(email)) {
                ponerError('grupoEmail', 'errorEmail', 'Ese correo no parece válido.');
                valido = false;
            }

            if (!passL) {
                ponerError('grupoPass', 'errorPass', 'Escribe tu contraseña.');
                valido = false;
            }

            if (!valido) { temblar(); return; }

            const btn = document.getElementById('btnLogin');
            activarCarga(btn, 'Verificando...');

            /* 🔗 BACKEND: reemplaza por fetch('CONTROLADOR/login.php', ...) */
            setTimeout(() => {
                desactivarCarga(btn, 'Iniciar Sesión');
                mostrarToast('¡Sesión iniciada! (demo sin backend)');
                formLogin.reset();
            }, 1500);
        });
    }

    /* ---------- 6. ENVÍO — REGISTRO (✏️ con las nuevas validaciones) ---------- */
    const formRegistro = document.getElementById('formRegistro');
    if (formRegistro) {
        formRegistro.addEventListener('submit', e => {
            e.preventDefault();
            limpiarErrores(formRegistro);

            const nombre = document.getElementById('regNombre').value.trim();
            const tel    = document.getElementById('regTel').value.trim();
            const fecha  = document.getElementById('regFecha').value;
            const email  = document.getElementById('regEmail').value.trim();
            const passV  = document.getElementById('regPass').value;
            const pass2  = document.getElementById('regPass2').value;
            const termos = document.getElementById('regTerminos').checked;
            let valido = true;

            // Nombre
            if (nombre.length < 3) {
                ponerError('grupoNombre', 'errorNombre', 'Escribe tu nombre completo.');
                valido = false;
            }

            // Teléfono: se quitan espacios y guiones antes de validar
            if (!REGEX_TEL.test(tel.replace(/[\s\-()]/g, ''))) {
                ponerError('grupoTel', 'errorTel', 'Teléfono no válido (7 a 15 dígitos).');
                valido = false;
            }

            // Fecha de nacimiento: requerida + edad mínima
            if (!fecha) {
                ponerError('grupoFecha', 'errorFecha', 'Selecciona tu fecha de nacimiento.');
                valido = false;
            } else {
                const edad = calcularEdad(fecha);
                if (edad < EDAD_MINIMA) {
                    ponerError('grupoFecha', 'errorFecha', 'Debes tener al menos ' + EDAD_MINIMA + ' años.');
                    valido = false;
                } else if (edad > 120) {
                    ponerError('grupoFecha', 'errorFecha', 'Esa fecha no parece correcta.');
                    valido = false;
                }
            }

            // Correo
            if (!email) {
                ponerError('grupoEmail', 'errorEmail', 'Escribe tu correo.');
                valido = false;
            } else if (!REGEX_EMAIL.test(email)) {
                ponerError('grupoEmail', 'errorEmail', 'Ese correo no parece válido.');
                valido = false;
            }

            // Contraseña
            if (obtenerPuntaje(passV) < 4) {
                ponerError('grupoPass', 'errorPass', 'Tu contraseña aún no cumple todo.');
                valido = false;
            }

            // Confirmación
            if (!pass2 || pass2 !== passV) {
                ponerError('grupoPass2', 'errorPass2', 'Las contraseñas no coinciden.');
                valido = false;
            }

            // Términos
            if (!termos) {
                ponerError('grupoTerminos', 'errorTerminos', 'Debes aceptar los términos para continuar.');
                valido = false;
            }

            if (!valido) { temblar(); return; }

            const btn = document.getElementById('btnRegistro');
            activarCarga(btn, 'Creando cuenta...');

            /* 🔗 BACKEND: envía también regTel, regFecha y regTerminos
               en el FormData cuando conectes CONTROLADOR/registro.php */
            setTimeout(() => {
                desactivarCarga(btn, 'Crear Cuenta');
                mostrarToast('¡Cuenta creada! (demo sin backend)');
                formRegistro.reset();
                limpiarErrores(formRegistro);
                document.getElementById('fuerzaWrap').hidden = true;
                document.querySelectorAll('#checklist li').forEach(li => li.classList.remove('ok'));
            }, 1500);
        });
    }
});