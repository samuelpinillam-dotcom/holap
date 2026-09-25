/* CONTROLADOR — conecta los formularios con la API PHP */
document.addEventListener('DOMContentLoaded', () => {

  // Tabs Login / Registro
  qs('#btnTabLogin').addEventListener('click', () => {
    qs('#btnTabLogin').classList.add('active', 'btn-primary');
    qs('#btnTabLogin').classList.remove('btn-outline-primary');
    qs('#btnTabRegister').classList.remove('active', 'btn-primary');
    qs('#btnTabRegister').classList.add('btn-outline-primary');
    qs('#formLogin').style.display = '';
    qs('#formRegister').style.display = 'none';
  });
  qs('#btnTabRegister').addEventListener('click', () => {
    qs('#btnTabRegister').classList.add('active', 'btn-primary');
    qs('#btnTabRegister').classList.remove('btn-outline-primary');
    qs('#btnTabLogin').classList.remove('active', 'btn-primary');
    qs('#btnTabLogin').classList.add('btn-outline-primary');
    qs('#formLogin').style.display = 'none';
    qs('#formRegister').style.display = '';
  });

  // LOGIN → POST api/auth.php?action=login
  qs('#formLogin').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Verificando…';
    try {
      const user = await apiLogin(qs('#loginEmail').value.trim(), qs('#loginPass').value);
      e.target.reset();
      renderDashboardFor(user);
    } catch (err) { alert(err.message); }
    finally { btn.disabled = false; btn.textContent = 'Ingresar'; }
  });

  // REGISTRO → POST api/auth.php?action=register (password_hash en el servidor)
  qs('#formRegister').addEventListener('submit', async e => {
    e.preventDefault();
    const body = {
      nombre: qs('#regName').value.trim(),
      apellido: qs('#regLastName').value.trim(),
      tipo_documento: qs('#regDocumentType').value,
      numero_documento: qs('#regDocument').value.trim(),
      direccion: qs('#regAddress').value.trim(),
      email: qs('#regEmail').value.trim(),
      telefono: qs('#regPhone').value.trim(),
      password: qs('#regPass').value,
      rol: qs('#regRole').value
    };
    try {
      await apiRegister(body);
      e.target.reset();
      renderDashboardFor(getCurrent());
    } catch (err) { alert(err.message); }
  });

  // LOGOUT → cierra sesión en el servidor
  qs('#btnLogout').addEventListener('click', async () => {
    await apiLogout();
    location.reload();
  });

  // Sesión activa al cargar la página (gracias a PHP $_SESSION)
  apiCurrent().then(u => { if (u) renderDashboardFor(u); });
});