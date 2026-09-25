
// Interacciones: menú lateral y selección de creadores
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.getElementById('hamburger');
  const menuOverlay = document.getElementById('menu-overlay');
  const menuClose = document.getElementById('menu-close');
  const menuBackdrop = document.querySelector('.menu-backdrop');
  const menuLinks = document.querySelectorAll('.menu-link');

  function openMenu(){
    menuOverlay.classList.remove('d-none');
    menuOverlay.setAttribute('aria-hidden','false');
  }
  function closeMenu(){
    menuOverlay.classList.add('d-none');
    menuOverlay.setAttribute('aria-hidden','true');
  }

  hamburger.addEventListener('click', openMenu);
  if(menuClose) menuClose.addEventListener('click', closeMenu);
  if(menuBackdrop) menuBackdrop.addEventListener('click', closeMenu);
  menuLinks.forEach(l => l.addEventListener('click', closeMenu));

  // Creators: mostrar detalles y atenuar el otro
  const creators = document.querySelectorAll('.creator-card');
  const details = document.getElementById('creator-details');
  const saberBtns = document.querySelectorAll('.saber-mas');

  function showCreator(id){
    creators.forEach(c => {
      if(c.dataset.id === id){
        c.classList.add('active');
        c.classList.remove('muted');
      } else {
        c.classList.remove('active');
        c.classList.add('muted');
      }
    });

    // Simula contenido dinámico (reemplázalo por tu contenido real)
    if(id === 'c1'){
      details.querySelector('.details-content').innerHTML = `
        <h6>Nombre 1</h6>
        <p class="bio">Bio breve del creador 1. Proyectos destacados, roles y enlaces.</p>
        <p class="small"><strong>Trabajos:</strong> Proyecto A, Proyecto X</p>`;
    } else if(id === 'c2'){
      details.querySelector('.details-content').innerHTML = `
        <h6>Nombre 2</h6>
        <p class="bio">Bio breve del creador 2. Roles, habilidades y ejemplos.</p>
        <p class="small"><strong>Trabajos:</strong> Proyecto B, Proyecto Y</p>`;
    }
  }

  saberBtns.forEach(b => {
    b.addEventListener('click', function(e){
      const id = this.dataset.id;
      showCreator(id);
    });
  });

  creators.forEach(c => {
    c.addEventListener('click', () => showCreator(c.dataset.id));
    c.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' ') showCreator(c.dataset.id);
    });
  });

  // Validación simple contacto
  const contactForm = document.getElementById('contact-form');
  if(contactForm){
    contactForm.addEventListener('submit', function(e){
      // opcional: validar y mostrar mensaje antes de enviar
      const email = contactForm.querySelector('input[name="email"]').value.trim();
      const mensaje = contactForm.querySelector('textarea[name="mensaje"]').value.trim();
      if(!email || !mensaje){
        e.preventDefault();
        alert('Por favor completa correo y mensaje antes de enviar.');
      }
    });
  }

});