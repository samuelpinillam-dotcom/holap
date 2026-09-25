/* ============================================================
   DELPINWARE — Páginas de servicio + submenú
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- 1. Animaciones al hacer scroll ---------- */
    const observador = new IntersectionObserver(entradas => {
        entradas.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                observador.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach(el => observador.observe(el));

    /* ---------- 2. Submenú: soporte para tocar (celulares) ----------
       En escritorio abre con hover; en pantallas táctiles abre con clic. */
    document.querySelectorAll('.submenu-toggle').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const item = btn.closest('.nav-item-submenu');
            // Cierra cualquier otro submenú abierto
            document.querySelectorAll('.nav-item-submenu.abierto').forEach(o => {
                if (o !== item) o.classList.remove('abierto');
            });
            item.classList.toggle('abierto');
        });
    });

    // Clic fuera del submenú = se cierra
    document.addEventListener('click', e => {
        if (!e.target.closest('.nav-item-submenu')) {
            document.querySelectorAll('.nav-item-submenu.abierto').forEach(o => o.classList.remove('abierto'));
        }
    });
});