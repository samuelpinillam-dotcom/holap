// ==================== MENÚ HAMBURGUESA ====================
const btnHamburguesa = document.getElementById('btnHamburguesa');
const navMobile = document.getElementById('navMobile');

// Abrir / cerrar menú
btnHamburguesa.addEventListener('click', function () {
    this.classList.toggle('active');
    navMobile.classList.toggle('active');
});

// Cerrar menú al hacer clic en un link
const navLinks = navMobile.querySelectorAll('a');
navLinks.forEach(link => {
    link.addEventListener('click', function () {
        btnHamburguesa.classList.remove('active');
        navMobile.classList.remove('active');
    });
});

// Cerrar menú al hacer clic fuera
document.addEventListener('click', function (event) {
    const isClickInsideNav = navMobile.contains(event.target);
    const isClickInsideBtn = btnHamburguesa.contains(event.target);

    if (!isClickInsideNav && !isClickInsideBtn && navMobile.classList.contains('active')) {
        btnHamburguesa.classList.remove('active');
        navMobile.classList.remove('active');
    }
});

// ==================== BOTONES DE AUTENTICACIÓN ====================
const btnLogin = document.querySelector('.btn-login');
const btnRegister = document.querySelector('.btn-register');

btnLogin.addEventListener('click', function () {
    alert('Redirigiendo a Iniciar Sesión...');
    // Aquí irá el link a la página de login
    // window.location.href = 'pages/login.html';
});

btnRegister.addEventListener('click', function () {
    alert('Redirigiendo a Registrarse...');
    // Aquí irá el link a la página de registro
    // window.location.href = 'pages/register.html';
});

// ==================== BOTONES EXPLORAR ====================
const botonesExplorar = document.querySelectorAll('.btn-explorar');

botonesExplorar.forEach((boton, index) => {
    boton.addEventListener('click', function () {
        const nombreServicio = this.previousElementSibling.textContent;
        alert(`Explorar: ${nombreServicio}`);
        // Aquí irán los links a las páginas/juegos
        // window.location.href = `pages/servicio-${index + 1}.html`;
    });
});

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});