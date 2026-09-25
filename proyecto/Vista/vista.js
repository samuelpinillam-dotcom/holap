/* ============================================================
   Lyon Technologies · Vista/vista.js  (ARCHIVO COMPLETO)
   Todas las vistas consumen la API PHP (api/*.php → MySQL).
   Requiere que Modelo/modelo.js se cargue ANTES que este archivo.
   ============================================================ */

/* ---------- 1 · NAVEGACIÓN Y ACTIVIDAD ---------- */
async function renderActivity() {
  const div = qs('#activityList');
  if (!div) return;
  const arr = await getActivity();
  if (!arr.length) { div.innerHTML = '<small class="text-muted">Sin actividad</small>'; return; }
  div.innerHTML = arr.map(a =>
    '<div class="mb-1"><small>' + escapeHtml(formatDate(a.ts)) + ' — ' + escapeHtml(a.txt) + '</small></div>').join('');
}

const modulesByRole = {
  'Administrador': ['Resumen de empresa','Gestión de usuarios','Productos','Inventario','Reportes','Proveedores','Promociones','Facturas','Soporte Técnico'],
  'Empleado': ['Ventas','Clientes','Devoluciones','Productos','Facturas','Soporte Técnico'],
  'Logística': ['Pedidos','Etiquetas','Recibos','Proveedores'],
  'Cliente': ['Tienda','Mis compras','Soporte']
};

qs('#btnProfile').addEventListener('click', () => viewPerfil());

function renderDashboardFor(u) {
  qs('#homeView').style.display = 'none';
  qs('#dashboard').style.display = '';
  qs('#dashWelcome').textContent = 'Hola, ' + (u.name || '');
  const mods = modulesByRole[u.role] || [];
  const list = qs('#moduleList');
  list.innerHTML = '';
  mods.forEach(m => {
    const b = document.createElement('button');
    b.className = 'list-group-item list-group-item-action';
    b.textContent = m;
    b.addEventListener('click', () => openModule(m));
    list.appendChild(b);
  });
  const activityCard = qs('#activityCard');
  if (activityCard) activityCard.style.display = u.role === 'Administrador' ? '' : 'none';
  openModule(mods[0] || 'Mis compras');
  if (u.role === 'Administrador') renderActivity();
}

function openModule(name) {
  const user = getCurrent();
  if (!user) return alert('No has iniciado sesión.');
  qs('#contentArea').innerHTML =
    '<div class="card p-5 text-center"><div class="spinner-border"></div><p class="mt-3 text-muted mb-0">Cargando módulo…</p></div>';
  try {
    switch (name) {
      case 'Resumen de empresa':  return viewResumen();
      case 'Gestión de usuarios': return viewUsuarios();
      case 'Productos':           return viewProductos();
      case 'Inventario':          return viewInventario();
      case 'Reportes':            return viewReportes();
      case 'Proveedores':         return viewProveedores();
      case 'Promociones':         return viewPromociones();
      case 'Facturas':            return viewFacturas();
      case 'Ventas':              return viewVentas();
      case 'Clientes':            return viewClientes();
      case 'Devoluciones':        return viewDevoluciones();
      case 'Pedidos':             return viewPedidos();
      case 'Etiquetas':           return viewEtiquetas();
      case 'Recibos':             return viewRecibos();
      case 'Mis compras':         return viewMisCompras();
      case 'Soporte':             return viewSoporte();
      case 'Soporte Técnico':     return viewSoporteTecnico();
      case 'Tienda':              return viewTienda();
      default:
        qs('#contentArea').innerHTML = '<div class="card p-3"><h5>' + escapeHtml(name) + '</h5><p>Este módulo está en construcción.</p></div>';
    }
  } catch (err) {
    qs('#contentArea').innerHTML =
      '<div class="card p-3"><h5 class="fw-bold">Error al abrir el módulo</h5>' +
      '<p class="mb-1">' + escapeHtml(err.message) + '</p>' +
      '<p class="small text-muted mb-0">Si dice "X is not defined", tu archivo Vista/vista.js está incompleto: reemplázalo por completo.</p></div>';
  }
}

/* ---------- 2 · USUARIOS ---------- */
async function viewUsuarios() {
  let users;
  try { users = await getUsuarios(); } catch (e) { return alert(e.message); }

  let html = '<div class="card p-3"><div class="d-flex justify-content-between align-items-center"><h5 class="fw-bold mb-0">Gestión de usuarios</h5><button id="btnAddUser" class="btn btn-primary btn-sm">Nuevo usuario</button></div>';
  html += '<div class="table-responsive mt-3"><table class="table table-hover align-middle"><thead><tr><th>Nombre</th><th>Documento</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
  users.forEach(u => {
    html += '<tr data-id="' + u.id + '">';
    html += '<td>' + escapeHtml((u.name || '') + ' ' + (u.lastName || '')) + '</td>';
    html += '<td>' + escapeHtml((u.documentType || '-') + ' ' + (u.document || '-')) + '</td>';
    html += '<td>' + escapeHtml(u.email) + '</td>';
    html += '<td><span class="badge badge-estado-descuento">' + escapeHtml(u.role) + '</span></td>';
    html += '<td><span class="badge ' + (u.status === 'Activo' ? 'badge-estado-activo' : 'badge-estado-inactivo') + '">' + escapeHtml(u.status || 'Activo') + '</span></td>';
    html += '<td><button class="btn btn-sm btn-outline-primary btn-edit">Editar</button> <button class="btn btn-sm btn-outline-warning btn-toggle">' + (u.status === 'Activo' ? 'Inactivar' : 'Activar') + '</button> <button class="btn btn-sm btn-outline-danger btn-del">Eliminar</button></td></tr>';
  });
  html += '</tbody></table></div></div>';
  qs('#contentArea').innerHTML = html;

  qs('#btnAddUser').addEventListener('click', async () => {
    const nombre = prompt('Nombre'); if (!nombre) return;
    const apellido = prompt('Apellido'); if (!apellido) return;
    const tipo_documento = prompt('Tipo de documento (CC, TI, CE)', 'CC') || 'CC';
    const numero_documento = prompt('Número de documento'); if (!numero_documento) return;
    const direccion = prompt('Dirección'); if (!direccion) return;
    const email = prompt('Correo electrónico'); if (!email) return;
    const telefono = prompt('Teléfono'); if (!telefono) return;
    const rol = prompt('Rol (Administrador, Empleado, Logística, Cliente)', 'Empleado') || 'Empleado';
    const password = prompt('Contraseña (mínimo 6)'); if (!password) return;
    try {
      await createUsuario({ nombre, apellido, tipo_documento, numero_documento, direccion, email, telefono, rol, password });
      logActivity('Usuario creado: ' + email);
      viewUsuarios();
    } catch (err) { alert(err.message); }
  });

  qsa('#contentArea .btn-toggle').forEach(b => b.addEventListener('click', async e => {
    const id = +e.target.closest('tr').dataset.id;
    const u = users.find(x => x.id === id); if (!u) return;
    try {
      await updateUsuario(id, { estado: u.status === 'Activo' ? 'Inactivo' : 'Activo' });
      logActivity('Usuario ' + (u.status === 'Activo' ? 'inactivado' : 'activado') + ': ' + u.email);
      viewUsuarios();
    } catch (err) { alert(err.message); }
  }));

  qsa('#contentArea .btn-del').forEach(b => b.addEventListener('click', async e => {
    const id = +e.target.closest('tr').dataset.id;
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try { await deleteUsuario(id); logActivity('Usuario eliminado'); viewUsuarios(); }
    catch (err) { alert(err.message); }
  }));

  qsa('#contentArea .btn-edit').forEach(b => b.addEventListener('click', async e => {
    const id = +e.target.closest('tr').dataset.id;
    const u = users.find(x => x.id === id); if (!u) return;
    const nombre = prompt('Nombre', u.name); if (nombre === null) return;
    const apellido = prompt('Apellido', u.lastName || ''); if (apellido === null) return;
    const direccion = prompt('Dirección', u.address || '');
    const telefono = prompt('Teléfono', u.phone || '');
    const rol = prompt('Rol', u.role); if (rol === null) return;
    try {
      await updateUsuario(id, { nombre, apellido, direccion, telefono, rol });
      logActivity('Usuario editado: ' + (u.email || id));
      viewUsuarios();
    } catch (err) { alert(err.message); }
  }));
}

/* ---------- 3 · PRODUCTOS ---------- */
async function viewProductos() {
  let products;
  try { products = await getProductos(); } catch (e) { return alert(e.message); }

  let html = '<div class="card p-3"><div class="d-flex justify-content-between align-items-center"><h5 class="fw-bold mb-0">Productos</h5><button id="btnNewProd" class="btn btn-primary btn-sm">Nuevo producto</button></div>';
  html += '<div class="table-responsive mt-3"><table class="table table-hover align-middle"><thead><tr><th>Nombre</th><th>Descripción</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
  products.forEach(p => {
    html += '<tr data-id="' + p.id + '"><td>' + escapeHtml(p.name) + '</td><td class="small text-muted">' + escapeHtml(p.desc || '-') + '</td><td>' + fmtMoney(p.price) + '</td><td>' + p.qty + '</td>';
    html += '<td><span class="badge ' + (p.status === 'Activo' ? 'badge-estado-activo' : 'badge-estado-inactivo') + '">' + p.status + '</span></td>';
    html += '<td><button class="btn btn-sm btn-outline-primary btn-edit">Editar</button> <button class="btn btn-sm btn-outline-warning btn-toggle">' + (p.status === 'Activo' ? 'Inactivar' : 'Activar') + '</button></td></tr>';
  });
  html += '</tbody></table></div></div>';
  qs('#contentArea').innerHTML = html;

  qs('#btnNewProd').addEventListener('click', async () => {
    const nombre = prompt('Nombre del producto'); if (!nombre) return;
    const descripcion = prompt('Descripción', '') || '';
    const precio = Number(prompt('Precio de venta', '0') || 0);
    const costo = Number(prompt('Costo (para márgenes)', '0') || 0);
    const cantidad = Number(prompt('Cantidad inicial', '0') || 0);
    const stock_minimo = Number(prompt('Stock mínimo', '3') || 3);
    if ([precio, costo, cantidad, stock_minimo].some(n => isNaN(n) || n < 0)) return alert('Los valores numéricos no pueden ser negativos.');
    try {
      await createProducto({ nombre, descripcion, precio, costo, cantidad, stock_minimo });
      logActivity('Producto creado: ' + nombre);
      viewProductos();
    } catch (err) { alert(err.message); }
  });

  qsa('#contentArea .btn-toggle').forEach(b => b.addEventListener('click', async e => {
    const id = +e.target.closest('tr').dataset.id;
    const p = products.find(x => x.id === id); if (!p) return;
    try {
      await updateProducto(id, { estado: p.status === 'Activo' ? 'Inactivo' : 'Activo' });
      logActivity('Producto ' + (p.status === 'Activo' ? 'inactivado' : 'activado') + ': ' + p.name);
      viewProductos();
    } catch (err) { alert(err.message); }
  }));

  qsa('#contentArea .btn-edit').forEach(b => b.addEventListener('click', async e => {
    const id = +e.target.closest('tr').dataset.id;
    const p = products.find(x => x.id === id); if (!p) return;
    const nombre = prompt('Nombre', p.name); if (nombre === null) return;
    const descripcion = prompt('Descripción', p.desc || '');
    const precio = Number(prompt('Precio', p.price) || p.price);
    const cantidad = Number(prompt('Stock', p.qty) || p.qty);
    const stock_minimo = Number(prompt('Stock mínimo', p.min) || p.min);
    if ([precio, cantidad, stock_minimo].some(n => isNaN(n) || n < 0)) return alert('Valores inválidos.');
    try {
      await updateProducto(id, { nombre, descripcion, precio, cantidad, stock_minimo });
      logActivity('Producto editado: ' + (nombre || p.name));
      viewProductos();
    } catch (err) { alert(err.message); }
  }));
}

/* ---------- 4 · CLIENTES ---------- */
async function viewClientes() {
  let clients;
  try { clients = await getClientes(); } catch (e) { return alert(e.message); }

  let html = '<div class="card p-3"><div class="d-flex justify-content-between align-items-center"><h5 class="fw-bold mb-0">Clientes</h5><button id="btnNewClient" class="btn btn-primary btn-sm">Nuevo cliente</button></div>';
  html += '<div class="table-responsive mt-3"><table class="table table-hover align-middle"><thead><tr><th>Nombre</th><th>Correo</th><th>Teléfono</th><th>Acciones</th></tr></thead><tbody>';
  clients.forEach(c => {
    html += '<tr data-id="' + c.id + '"><td>' + escapeHtml(c.name) + '</td><td>' + escapeHtml(c.email || '-') + '</td><td>' + escapeHtml(c.phone || '-') + '</td>';
    html += '<td><button class="btn btn-sm btn-outline-primary btn-edit">Editar</button> <button class="btn btn-sm btn-outline-danger btn-del">Eliminar</button></td></tr>';
  });
  html += '</tbody></table></div></div>';
  qs('#contentArea').innerHTML = html;

  qs('#btnNewClient').addEventListener('click', async () => {
    const nombre = prompt('Nombre completo'); if (!nombre) return;
    const email = prompt('Correo electrónico', '') || '';
    const telefono = prompt('Teléfono', '') || '';
    try {
      await createCliente({ nombre, email, telefono });
      logActivity('Cliente creado: ' + nombre);
      viewClientes();
    } catch (err) { alert(err.message); }
  });

  qsa('#contentArea .btn-del').forEach(b => b.addEventListener('click', async e => {
    const id = +e.target.closest('tr').dataset.id;
    if (!confirm('¿Seguro que deseas eliminar este cliente?')) return;
    try { await deleteCliente(id); logActivity('Cliente eliminado'); viewClientes(); }
    catch (err) { alert(err.message); }
  }));

  qsa('#contentArea .btn-edit').forEach(b => b.addEventListener('click', async e => {
    const id = +e.target.closest('tr').dataset.id;
    const c = clients.find(x => x.id === id); if (!c) return;
    const nombre = prompt('Nombre', c.name); if (nombre === null) return;
    const email = prompt('Correo electrónico', c.email);
    const telefono = prompt('Teléfono', c.phone);
    try {
      await updateCliente(id, { nombre, email, telefono });
      logActivity('Cliente editado: ' + (nombre || c.name));
      viewClientes();
    } catch (err) { alert(err.message); }
  }));
}

/* ---------- 5 · PROVEEDORES ---------- */
async function viewProveedores() {
  let provs;
  try { provs = await getProveedores(); } catch (e) { return alert(e.message); }

  let html = '<div class="card p-3"><div class="d-flex justify-content-between align-items-center"><h5 class="fw-bold mb-0">Proveedores</h5><button id="btnNewProv" class="btn btn-primary btn-sm">Nuevo proveedor</button></div>';
  html += '<div class="table-responsive mt-3"><table class="table table-hover align-middle"><thead><tr><th>Nombre</th><th>Contacto</th><th>Productos</th><th>Acción</th></tr></thead><tbody>';
  provs.forEach(p => {
    html += '<tr data-id="' + p.id + '"><td>' + escapeHtml(p.name) + '</td><td>' + escapeHtml(p.contact || '-') + '</td><td>' + escapeHtml(p.items || '-') + '</td>';
    html += '<td><button class="btn btn-sm btn-outline-danger btn-del">Eliminar</button></td></tr>';
  });
  html += '</tbody></table></div></div>';
  qs('#contentArea').innerHTML = html;

  qs('#btnNewProv').addEventListener('click', async () => {
    const nombre = prompt('Nombre del proveedor'); if (!nombre) return;
    const contacto = prompt('Contacto', '') || '';
    const productos = prompt('Productos que suministra', '') || '';
    try {
      await createProveedor({ nombre, contacto, productos });
      logActivity('Proveedor creado: ' + nombre);
      viewProveedores();
    } catch (err) { alert(err.message); }
  });

  qsa('#contentArea .btn-del').forEach(b => b.addEventListener('click', async e => {
    const id = +e.target.closest('tr').dataset.id;
    if (!confirm('¿Seguro que deseas eliminar este proveedor?')) return;
    try { await deleteProveedor(id); logActivity('Proveedor eliminado'); viewProveedores(); }
    catch (err) { alert(err.message); }
  }));
}

/* ---------- 6 · PROMOCIONES ---------- */
async function viewPromociones() {
  let promotions;
  try { promotions = await getPromociones(); } catch (e) { return alert(e.message); }

  let html = '<div class="card p-3"><div class="d-flex justify-content-between align-items-center"><h5 class="fw-bold mb-0">Promociones</h5><button id="btnNewPromotion" class="btn btn-primary btn-sm">Nueva promoción</button></div>';
  html += '<div class="table-responsive mt-3"><table class="table table-hover align-middle"><thead><tr><th>Nombre</th><th>Descuento</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
  promotions.forEach(p => {
    html += '<tr data-id="' + p.id + '"><td>' + escapeHtml(p.name) + '</td><td><span class="badge badge-estado-descuento">' + p.discount + '%</span></td><td>' + escapeHtml(p.start) + '</td><td>' + escapeHtml(p.end) + '</td>';
    html += '<td><span class="badge ' + (p.status === 'Activa' ? 'badge-estado-activa' : 'badge-estado-inactivo') + '">' + p.status + '</span></td>';
    html += '<td><button class="btn btn-sm btn-outline-primary btn-edit">Editar</button> <button class="btn btn-sm btn-outline-warning btn-toggle">' + (p.status === 'Activa' ? 'Desactivar' : 'Activar') + '</button> <button class="btn btn-sm btn-outline-danger btn-del">Eliminar</button></td></tr>';
  });
  html += '</tbody></table></div></div>';
  qs('#contentArea').innerHTML = html;

  qs('#btnNewPromotion').addEventListener('click', async () => {
    const nombre = prompt('Nombre de la promoción'); if (!nombre) return;
    const descuento = Number(prompt('Porcentaje de descuento', '10') || 0);
    const fecha_inicio = prompt('Fecha de inicio (AAAA-MM-DD)', new Date().toISOString().slice(0, 10)); if (!fecha_inicio) return;
    const fecha_fin = prompt('Fecha final (AAAA-MM-DD)', fecha_inicio); if (!fecha_fin) return;
    try {
      await createPromocion({ nombre, descuento, fecha_inicio, fecha_fin });
      logActivity('Promoción creada: ' + nombre);
      viewPromociones();
    } catch (err) { alert(err.message); }
  });

  qsa('#contentArea .btn-toggle').forEach(b => b.addEventListener('click', async e => {
    const id = +e.target.closest('tr').dataset.id;
    const p = promotions.find(x => x.id === id); if (!p) return;
    try {
      await updatePromocion(id, { estado: p.status === 'Activa' ? 'Inactiva' : 'Activa' });
      logActivity('Promoción ' + (p.status === 'Activa' ? 'desactivada' : 'activada') + ': ' + p.name);
      viewPromociones();
    } catch (err) { alert(err.message); }
  }));

  qsa('#contentArea .btn-del').forEach(b => b.addEventListener('click', async e => {
    const id = +e.target.closest('tr').dataset.id;
    if (!confirm('¿Eliminar esta promoción?')) return;
    try { await deletePromocion(id); logActivity('Promoción eliminada'); viewPromociones(); }
    catch (err) { alert(err.message); }
  }));

  qsa('#contentArea .btn-edit').forEach(b => b.addEventListener('click', async e => {
    const id = +e.target.closest('tr').dataset.id;
    const p = promotions.find(x => x.id === id); if (!p) return;
    const nombre = prompt('Nombre', p.name); if (nombre === null) return;
    const descuento = Number(prompt('Descuento %', p.discount) || p.discount);
    const fecha_inicio = prompt('Inicio', p.start) || p.start;
    const fecha_fin = prompt('Fin', p.end) || p.end;
    try {
      await updatePromocion(id, { nombre, descuento, fecha_inicio, fecha_fin });
      logActivity('Promoción editada: ' + p.name);
      viewPromociones();
    } catch (err) { alert(err.message); }
  }));
}

/* ---------- 7 · VENTAS ---------- */
async function viewVentas() {
  let products, clients, promotions, sales;
  try { [products, clients, promotions, sales] = await Promise.all([getProductos(), getClientes(), getActivePromotions(), getVentas()]); }
  catch (e) { return alert(e.message); }
  products = products.filter(p => p.status !== 'Inactivo' && p.qty > 0);

  let html = '<div class="card p-3"><h5 class="fw-bold">Ventas</h5>';
  html += '<div class="row g-2"><div class="col-md-5"><label class="form-label">Producto</label><select id="saleProduct" class="form-select"><option value="">Selecciona un producto</option>'
        + products.map(p => '<option value="' + p.id + '">' + escapeHtml(p.name) + ' — ' + fmtMoney(p.price) + '</option>').join('') + '</select></div>';
  html += '<div class="col-md-2"><label class="form-label">Cantidad</label><input id="saleQty" type="number" class="form-control" min="1" value="1"></div>';
  html += '<div class="col-md-5"><label class="form-label">Cliente</label><select id="saleClient" class="form-select"><option value="">Venta sin cliente registrado</option>'
        + clients.map(c => '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>').join('') + '</select></div></div>';
  html += '<div class="mt-2"><label class="form-label">Promoción</label><select id="salePromotion" class="form-select"><option value="">Sin promoción</option>'
        + promotions.map(p => '<option value="' + p.id + '">' + escapeHtml(p.name) + ' (' + p.discount + '%)</option>').join('') + '</select></div>';
  html += '<div class="mt-3"><button id="btnRegisterSale" class="btn btn-primary">Registrar venta</button></div>';
  html += '<hr><h6 class="fw-bold">Ventas recientes</h6><div id="salesList"></div></div>';
  qs('#contentArea').innerHTML = html;
  renderSalesList(sales);

  qs('#btnRegisterSale').addEventListener('click', async () => {
    const p = products.find(x => x.id === +qs('#saleProduct').value);
    const qty = Number(qs('#saleQty').value || 0);
    const clientId = +qs('#saleClient').value || 0;
    const promotionId = +qs('#salePromotion').value || 0;
    if (!p || qty <= 0) return alert('Selecciona producto y cantidad válida.');
    if (p.qty < qty) return alert('No hay suficiente stock.');
    const sel = qs('#saleClient');
    const clientName = clientId ? sel.options[sel.selectedIndex].text : 'Cliente general';
    try {
      const r = await createVenta({ id_producto: p.id, cantidad: qty, id_cliente: clientId, id_promocion: promotionId });
      logActivity('Venta registrada: ' + r.data.numero + ' — ' + clientName + ' — ' + fmtMoney(r.data.total));
      alert('Venta registrada. Total: ' + fmtMoney(r.data.total));
      if (confirm('¿Deseas imprimir la factura?')) {
        printInvoice({ number: r.data.numero, clientName, items: [{ name: p.name, price: p.price, qty }],
          subtotal: r.data.subtotal, discount: r.data.descuento, iva: r.data.iva, total: r.data.total, date: nowISO() });
      }
      viewVentas();
    } catch (err) { alert(err.message); }
  });
}

function renderSalesList(sales) {
  const el = qs('#salesList'); if (!el) return;
  if (!sales || !sales.length) { el.innerHTML = '<small class="text-muted">Sin ventas registradas</small>'; return; }
  el.innerHTML = sales.slice(0, 10).map(s =>
    '<div class="mb-1"><span class="badge badge-estado-descuento me-1">' + escapeHtml(s.number) + '</span> '
    + escapeHtml(s.clientName) + ' — <strong>' + fmtMoney(s.total) + '</strong> — <small class="text-muted">'
    + escapeHtml(new Date(s.date).toLocaleString('es-CO')) + '</small></div>').join('');
}

/* ---------- 8 · FACTURAS ---------- */
function createInvoiceText(s) {
  return ['FACTURA DE VENTA', 'Número: ' + (s.number || s.id), 'Fecha: ' + new Date(s.date).toLocaleString('es-CO'),
    'Cliente: ' + (s.clientName || '-'), 'Estado: ' + (s.invoiceStatus || 'Activa'), '', 'PRODUCTOS',
    ...(s.items || []).map(i => ' - ' + i.name + ' x' + i.qty + ' = ' + fmtMoney(i.price * i.qty)), '',
    'Subtotal: ' + fmtMoney(s.subtotal), 'Descuento: ' + fmtMoney(s.discount),
    'IVA (19%): ' + fmtMoney(s.iva), 'TOTAL: ' + fmtMoney(s.total)].join('\n');
}

function printInvoice(s) {
  const win = window.open('', '_blank', 'width=800,height=700');
  if (!win) return alert('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes.');
  const items = (s.items || []).map(i => '<tr><td>' + escapeHtml(i.name) + '</td><td>' + i.qty + '</td><td>' + fmtMoney(i.price) + '</td><td>' + fmtMoney(i.price * i.qty) + '</td></tr>').join('');
  win.document.write('<!doctype html><html><head><title>Factura ' + escapeHtml(s.number || '') + '</title><style>body{font-family:Arial;padding:30px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left}.total{text-align:right;margin-top:20px}</style></head><body><h1>Lyon Technologies</h1><h2>Factura ' + escapeHtml(s.number || '') + '</h2><p>Cliente: ' + escapeHtml(s.clientName || '-') + '</p><p>Fecha: ' + escapeHtml(new Date(s.date).toLocaleString('es-CO')) + '</p><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio</th><th>Total</th></tr></thead><tbody>' + items + '</tbody></table><div class="total"><p>Subtotal: ' + fmtMoney(s.subtotal) + '</p><p>Descuento: ' + fmtMoney(s.discount) + '</p><p>IVA: ' + fmtMoney(s.iva) + '</p><h2>Total: ' + fmtMoney(s.total) + '</h2></div></body></html>');
  win.document.close(); win.focus();
  setTimeout(() => win.print(), 250);
}

async function sendInvoice(s) {
  try {
    await accionVenta(s.id, 'enviar');
    logActivity('Factura enviada: ' + s.number);
    alert('Factura marcada como enviada (estado guardado en la base de datos).');
    viewFacturas();
  } catch (err) { alert(err.message); }
}

async function cancelInvoice(s) {
  if (!confirm('¿Anular la factura ' + s.number + '?')) return;
  try {
    await accionVenta(s.id, 'anular');
    logActivity('Factura anulada: ' + s.number);
    alert('Factura anulada.');
    viewFacturas();
  } catch (err) { alert(err.message); }
}

async function viewFacturas() {
  let sales;
  try { sales = await getVentas(); } catch (e) { return alert(e.message); }

  let html = '<div class="card p-3"><h5 class="fw-bold">Emisión de facturas</h5>';
  html += '<div class="table-responsive mt-2"><table class="table table-hover align-middle"><thead><tr><th>Número</th><th>Cliente</th><th>Subtotal</th><th>Descuento</th><th>IVA</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
  sales.forEach(s => {
    const badge = s.invoiceStatus === 'Activa' ? 'badge-estado-activa' : (s.invoiceStatus === 'Enviada' ? 'badge-estado-enviada' : 'badge-estado-inactivo');
    html += '<tr data-id="' + s.id + '"><td>' + escapeHtml(s.number) + '</td><td>' + escapeHtml(s.clientName) + '</td><td>' + fmtMoney(s.subtotal) + '</td><td>' + fmtMoney(s.discount) + '</td><td>' + fmtMoney(s.iva) + '</td><td><strong>' + fmtMoney(s.total) + '</strong></td>';
    html += '<td><span class="badge ' + badge + '">' + escapeHtml(s.invoiceStatus) + '</span></td>';
    html += '<td><button class="btn btn-sm btn-outline-primary btn-print">Imprimir</button> <button class="btn btn-sm btn-outline-secondary btn-send">Enviar</button> <button class="btn btn-sm btn-outline-danger btn-cancel">Anular</button></td></tr>';
  });
  html += '</tbody></table></div></div>';
  qs('#contentArea').innerHTML = html;

  qsa('#contentArea .btn-print').forEach(b => b.addEventListener('click', e => {
    const s = sales.find(x => x.id === +e.target.closest('tr').dataset.id); if (s) printInvoice(s);
  }));
  qsa('#contentArea .btn-send').forEach(b => b.addEventListener('click', e => {
    const s = sales.find(x => x.id === +e.target.closest('tr').dataset.id); if (s) sendInvoice(s);
  }));
  qsa('#contentArea .btn-cancel').forEach(b => b.addEventListener('click', e => {
    const s = sales.find(x => x.id === +e.target.closest('tr').dataset.id); if (s) cancelInvoice(s);
  }));
}

/* ---------- 9 · DEVOLUCIONES ---------- */
async function viewDevoluciones() {
  let sales, devolutions;
  try { [sales, devolutions] = await Promise.all([getVentas(), getDevoluciones()]); }
  catch (e) { return alert(e.message); }
  sales = sales.filter(s => s.invoiceStatus !== 'Anulada');

  let html = '<div class="card p-3"><h5 class="fw-bold">Devoluciones</h5>';
  html += '<div class="row g-2"><div class="col-md-5"><label class="form-label">Factura</label><select id="devSale" class="form-select"><option value="">Selecciona una factura</option>'
        + sales.map(s => '<option value="' + s.id + '">' + escapeHtml(s.number) + ' — ' + escapeHtml(s.clientName) + '</option>').join('')
        + '</select></div><div class="col-md-7"><label class="form-label">Motivo</label><input id="devReason" class="form-control" placeholder="Motivo de devolución"></div></div>';
  html += '<div id="devItems" class="mt-2"></div><div class="mt-2"><button id="btnDoDev" class="btn btn-primary">Registrar devolución</button></div>';
  html += '<hr><h6 class="fw-bold">Historial de devoluciones</h6><div class="table-responsive"><table class="table table-hover align-middle"><thead><tr><th>Factura</th><th>Producto</th><th>Cantidad</th><th>Motivo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
  devolutions.forEach(d => {
    html += '<tr data-id="' + d.id + '"><td>' + escapeHtml(d.saleNumber || '') + '</td><td>' + escapeHtml(d.productName || '-') + '</td><td>' + d.qty + '</td><td>' + escapeHtml(d.reason || '-') + '</td>';
    html += '<td><span class="badge ' + (d.status === 'Validada' ? 'badge-estado-activo' : 'badge-estado-pendiente') + '">' + escapeHtml(d.status) + '</span></td><td>';
    if (d.status === 'Pendiente') html += '<button class="btn btn-sm btn-outline-primary btn-validate">Validar</button> ';
    if (d.status === 'Validada' && !d.creditNote) html += '<button class="btn btn-sm btn-outline-secondary btn-credit">Nota crédito</button> ';
    if (d.creditNote) html += '<button class="btn btn-sm btn-outline-secondary btn-view-credit">Ver nota</button>';
    html += '</td></tr>';
  });
  html += '</tbody></table></div></div>';
  qs('#contentArea').innerHTML = html;

  qs('#devSale').addEventListener('change', () => {
    const s = sales.find(x => x.id === +qs('#devSale').value);
    qs('#devItems').innerHTML = !s ? '' : s.items.map(it =>
      '<div class="form-check"><label class="form-check-label"><input class="form-check-input" type="radio" name="devItem" value="' + it.id + '"> '
      + escapeHtml(it.name) + ' x' + it.qty + '</label></div>').join('');
  });

  qs('#btnDoDev').addEventListener('click', async () => {
    const saleId = +qs('#devSale').value;
    const sel = document.querySelector('input[name="devItem"]:checked');
    const motivo = qs('#devReason').value.trim();
    if (!saleId || !sel || !motivo) return alert('Selecciona factura, producto y escribe el motivo.');
    const s = sales.find(x => x.id === saleId);
    const it = s && s.items.find(x => x.id === +sel.value);
    if (!it) return alert('Producto no encontrado.');
    const qty = Number(prompt('Cantidad a devolver (máx ' + it.qty + ')', '1') || 0);
    if (qty <= 0 || qty > it.qty) return alert('Cantidad inválida.');
    try {
      await createDevolucion({ id_venta: saleId, id_item: it.id, cantidad: qty, motivo });
      logActivity('Devolución registrada: ' + s.number + ' — ' + it.name);
      alert('Devolución registrada. Ahora debe ser validada.');
      viewDevoluciones();
    } catch (err) { alert(err.message); }
  });

  qsa('#contentArea .btn-validate').forEach(b => b.addEventListener('click', async e => {
    const id = +e.target.closest('tr').dataset.id;
    if (!confirm('¿Validar esta devolución y devolver el stock al inventario?')) return;
    try {
      await accionDevolucion(id, 'validar');
      logActivity('Devolución validada');
      alert('Devolución validada e inventario actualizado.');
      viewDevoluciones();
    } catch (err) { alert(err.message); }
  }));

  qsa('#contentArea .btn-credit').forEach(b => b.addEventListener('click', async e => {
    const id = +e.target.closest('tr').dataset.id;
    try {
      const r = await accionDevolucion(id, 'nota');
      logActivity('Nota de crédito generada: ' + r.data.nota_credito);
      alert('Nota de crédito generada: ' + r.data.nota_credito);
      viewDevoluciones();
    } catch (err) { alert(err.message); }
  }));

  qsa('#contentArea .btn-view-credit').forEach(b => b.addEventListener('click', e => {
    const d = devolutions.find(x => x.id === +e.target.closest('tr').dataset.id);
    if (d) alert('NOTA DE CRÉDITO\nNúmero: ' + d.creditNote + '\nFactura: ' + d.saleNumber + '\nProducto: ' + d.productName + '\nCantidad: ' + d.qty + '\nMotivo: ' + d.reason);
  }));
}

/* ---------- 10 · TIENDA Y MIS COMPRAS (Cliente) ---------- */
async function viewTienda() {
  let products, promotions;
  try { [products, promotions] = await Promise.all([getProductos(), getActivePromotions()]); }
  catch (e) { return alert(e.message); }
  products = products.filter(p => p.status !== 'Inactivo' && p.qty > 0);

  let html = '<div class="card p-3"><h5 class="fw-bold">Tienda Lyon</h5>';
  if (!products.length) {
    qs('#contentArea').innerHTML = html + '<p class="text-muted mb-0">No hay productos disponibles.</p></div>';
    return;
  }
  html += '<div class="mb-3"><label class="form-label">Promoción para la compra</label><select id="storePromotion" class="form-select"><option value="">Sin promoción</option>'
        + promotions.map(p => '<option value="' + p.id + '">' + escapeHtml(p.name) + ' (' + p.discount + '%)</option>').join('') + '</select></div><div class="row g-3">';
  products.forEach(p => {
    html += '<div class="col-md-4"><div class="card p-3 h-100 card-producto"><h6 class="fw-bold">' + escapeHtml(p.name) + '</h6>'
         + '<p class="small text-muted desc-producto">' + escapeHtml(p.desc || '') + '</p>'
         + '<p class="fw-bold fs-5 mb-1" style="color:#fb923c">' + fmtMoney(p.price) + '</p>'
         + '<p class="small text-muted mb-3">Stock: <strong>' + p.qty + '</strong></p>'
         + '<button class="btn btn-primary btnBuy mt-auto" data-id="' + p.id + '">Comprar</button></div></div>';
  });
  html += '</div></div>';
  qs('#contentArea').innerHTML = html;

  qsa('#contentArea .btnBuy').forEach(btn => btn.addEventListener('click', async () => {
    const p = products.find(x => x.id === +btn.dataset.id);
    if (!p || p.status === 'Inactivo') return alert('Producto no disponible.');
    if (p.qty < 1) return alert('No hay stock disponible.');
    const promotionId = +qs('#storePromotion').value || 0;
    try {
      const r = await createVenta({ id_producto: p.id, cantidad: 1, id_promocion: promotionId });
      logActivity('Compra en Tienda: ' + r.data.numero);
      alert('Compra realizada con éxito: ' + r.data.numero + '\nTotal: ' + fmtMoney(r.data.total));
      viewTienda();
    } catch (err) { alert(err.message); }
  }));
}

async function viewMisCompras() {
  const user = getCurrent();
  if (!user) return alert('No has iniciado sesión.');
  let sales;
  try { sales = await getVentas(true); } catch (e) { return alert(e.message); }

  let html = '<div class="card p-3"><h5 class="fw-bold">Mis compras</h5>';
  if (!sales.length) {
    qs('#contentArea').innerHTML = html + '<p class="text-muted mb-0">Aún no tienes compras registradas.</p></div>';
    return;
  }
  html += '<div class="table-responsive mt-2"><table class="table table-hover align-middle"><thead><tr><th>Factura</th><th>Productos</th><th>Total</th><th>Fecha</th><th>Estado</th><th></th></tr></thead><tbody>';
  sales.forEach(s => {
    html += '<tr data-id="' + s.id + '"><td>' + escapeHtml(s.number) + '</td><td>' + s.items.map(i => escapeHtml(i.name) + ' x' + i.qty).join('<br>') + '</td>';
    html += '<td><strong>' + fmtMoney(s.total) + '</strong></td><td>' + escapeHtml(new Date(s.date).toLocaleString('es-CO')) + '</td>';
    html += '<td><span class="badge ' + (s.invoiceStatus === 'Anulada' ? 'badge-estado-inactivo' : 'badge-estado-activa') + '">' + s.invoiceStatus + '</span></td>';
    html += '<td><button class="btn btn-sm btn-outline-primary btn-print">Factura</button></td></tr>';
  });
  html += '</tbody></table></div></div>';
  qs('#contentArea').innerHTML = html;
  qsa('#contentArea .btn-print').forEach(b => b.addEventListener('click', e => {
    const s = sales.find(x => x.id === +e.target.closest('tr').dataset.id); if (s) printInvoice(s);
  }));
}

/* ---------- 11 · INVENTARIO ---------- */
async function viewInventario() {
  let products;
  try { products = await getProductos(); } catch (e) { return alert(e.message); }
  let html = '<div class="card p-3"><h5 class="fw-bold">Inventario</h5><div class="table-responsive"><table class="table table-hover align-middle"><thead><tr><th>Producto</th><th>Stock</th><th>Mínimo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>';
  products.forEach(p => {
    const alerta = p.qty <= (p.min || 3);
    html += '<tr data-id="' + p.id + '"><td>' + escapeHtml(p.name) + (alerta ? ' <span class="badge badge-estado-pendiente">Bajo</span>' : '') + '</td>';
    html += '<td><input class="form-control form-control-sm qty-input" style="max-width:110px" value="' + (p.qty || 0) + '" type="number" min="0"></td>';
    html += '<td>' + (p.min || 3) + '</td><td><span class="badge ' + (p.status === 'Activo' ? 'badge-estado-activo' : 'badge-estado-inactivo') + '">' + p.status + '</span></td>';
    html += '<td><button class="btn btn-sm btn-primary btn-update">Aplicar</button> <button class="btn btn-sm btn-outline-secondary btn-history">Historial</button> <button class="btn btn-sm btn-outline-warning btn-toggle">' + (p.status === 'Activo' ? 'Inactivar' : 'Activar') + '</button></td></tr>';
  });
  html += '</tbody></table></div></div>';
  qs('#contentArea').innerHTML = html;

  qsa('#contentArea .btn-update').forEach(b => b.addEventListener('click', async e => {
    const tr = e.target.closest('tr');
    const id = +tr.dataset.id;
    const newQty = Number(tr.querySelector('.qty-input').value || 0);
    if (isNaN(newQty) || newQty < 0) return alert('Cantidad inválida.');
    const p = products.find(x => x.id === id);
    try {
      await updateProducto(id, { cantidad: newQty });
      logActivity('Inventario actualizado: ' + (p ? p.name : id) + ' → ' + newQty + ' unidades');
      viewInventario();
    } catch (err) { alert(err.message); }
  }));

  qsa('#contentArea .btn-history').forEach(b => b.addEventListener('click', async e => {
    const p = products.find(x => x.id === +e.target.closest('tr').dataset.id);
    const acts = await getActivity();
    const hist = acts.filter(a => p && a.txt.includes(p.name)).slice(0, 10);
    if (!hist.length) return alert('No hay movimientos registrados para este producto.');
    alert(hist.map(a => formatDate(a.ts) + ' — ' + a.txt).join('\n'));
  }));

  qsa('#contentArea .btn-toggle').forEach(b => b.addEventListener('click', async e => {
    const id = +e.target.closest('tr').dataset.id;
    const p = products.find(x => x.id === id); if (!p) return;
    try {
      await updateProducto(id, { estado: p.status === 'Activo' ? 'Inactivo' : 'Activo' });
      logActivity('Inventario: producto ' + (p.status === 'Activo' ? 'inactivado' : 'activado') + ': ' + p.name);
      viewInventario();
    } catch (err) { alert(err.message); }
  }));
}

/* ---------- 12 · RESUMEN Y REPORTES (Administrador) ---------- */
async function viewResumen() {
  let products, sales, promotions;
  try { [products, sales, promotions] = await Promise.all([getProductos(), getVentas(), getPromociones()]); }
  catch (e) { return alert(e.message); }
  sales = sales.filter(s => s.invoiceStatus !== 'Anulada');
  const presupuesto = 20000000;
  const invValue = products.reduce((s, p) => s + ((p.qty || 0) * (p.cost || 0)), 0);
  const avgMargin = products.length
    ? Math.round(products.reduce((s, p) => s + ((((p.price - (p.cost || 0)) / (p.price || 1)) * 100) || 0), 0) / products.length)
    : 0;
  const kpi = (t, v) => '<div class="col-md-3"><div class="card p-2 mb-2"><small class="text-muted">' + t + '</small><div><strong>' + v + '</strong></div></div></div>';
  let html = '<div class="card p-3"><h5 class="fw-bold">Resumen de la empresa</h5><div class="row mt-3 g-2">';
  html += kpi('Presupuesto', fmtMoney(presupuesto)) + kpi('Valor inventario', fmtMoney(invValue));
  html += kpi('Ventas totales', sales.length) + kpi('Promociones', promotions.length);
  html += '</div><div class="mt-3"><h6>Margen promedio: ' + avgMargin + '%</h6><h6>Productos con bajo stock</h6><ul class="mb-0">';
  const low = products.filter(p => p.qty <= (p.min || 3));
  if (!low.length) html += '<li><small class="text-muted">Ninguno</small></li>';
  else low.forEach(p => html += '<li>' + escapeHtml(p.name) + ' — Cantidad: ' + p.qty + '</li>');
  html += '</ul></div></div>';
  qs('#contentArea').innerHTML = html;
}

async function viewReportes() {
  let sales, products, users;
  try { [sales, products, users] = await Promise.all([getVentas(), getProductos(), getUsuarios()]); }
  catch (e) { return alert(e.message); }
  let html = '<div class="card p-3"><h5 class="fw-bold">Reportes de ventas</h5><div class="row g-2">';
  html += '<div class="col-md-3"><label class="form-label">Desde</label><input id="repFrom" type="date" class="form-control"></div>';
  html += '<div class="col-md-3"><label class="form-label">Hasta</label><input id="repTo" type="date" class="form-control"></div>';
  html += '<div class="col-md-3"><label class="form-label">Producto</label><select id="repProduct" class="form-select"><option value="">Todos</option>' + products.map(p => '<option value="' + p.id + '">' + escapeHtml(p.name) + '</option>').join('') + '</select></div>';
  html += '<div class="col-md-3"><label class="form-label">Usuario / cliente</label><select id="repUser" class="form-select"><option value="">Todos</option>' + users.map(u => '<option value="' + u.id + '">' + escapeHtml((u.name || '') + ' ' + (u.lastName || '')) + '</option>').join('') + '</select></div>';
  html += '</div><div class="mt-2"><button id="btnGenRep" class="btn btn-primary">Generar reporte</button></div><div id="repArea" class="mt-3"></div></div>';
  qs('#contentArea').innerHTML = html;

  qs('#btnGenRep').addEventListener('click', () => {
    const f = qs('#repFrom').value, t = qs('#repTo').value;
    const productId = +qs('#repProduct').value || 0;
    const userId = +qs('#repUser').value || 0;
    let filtered = sales.filter(s => s.invoiceStatus !== 'Anulada');
    if (f) filtered = filtered.filter(s => (s.date || '').slice(0, 10) >= f);
    if (t) filtered = filtered.filter(s => (s.date || '').slice(0, 10) <= t);
    if (productId) filtered = filtered.filter(s => (s.items || []).some(i => (i.productId || i.id) === productId));
    if (userId) filtered = filtered.filter(s => s.clientId === userId);
    if (!filtered.length) { qs('#repArea').innerHTML = '<small class="text-muted">No hay información para los parámetros seleccionados.</small>'; return; }
    let h = '<div class="table-responsive"><table class="table table-hover"><thead><tr><th>Factura</th><th>Cliente</th><th>Total</th><th>Fecha</th></tr></thead><tbody>';
    h += filtered.map(s => '<tr><td>' + escapeHtml(s.number || s.id) + '</td><td>' + escapeHtml(s.clientName || '-') + '</td><td>' + fmtMoney(s.total) + '</td><td>' + escapeHtml(new Date(s.date).toLocaleString('es-CO')) + '</td></tr>').join('');
    h += '</tbody></table></div><button id="btnExportCSV" class="btn btn-sm btn-outline-primary mt-2">Exportar a CSV</button>';
    qs('#repArea').innerHTML = h;
    qs('#btnExportCSV').addEventListener('click', () => {
      const lines = ['Factura,Cliente,Total,Fecha'];
      filtered.forEach(s => lines.push([s.number || s.id, '"' + (s.clientName || '').replace(/"/g, '""') + '"', s.total || 0, s.date || ''].join(',')));
      downloadText('reporte_ventas.csv', lines.join('\n'));
      logActivity('Reporte exportado (CSV)');
    });
  });
}

/* ---------- 13 · PEDIDOS, ETIQUETAS Y RECIBOS (Logística) ---------- */
async function viewPedidos() {
  let orders;
  try { orders = await getPedidos(); } catch (e) { return alert(e.message); }
  let html = '<div class="card p-3"><div class="d-flex justify-content-between align-items-center"><h5 class="fw-bold mb-0">Pedidos</h5><button id="btnNewOrder" class="btn btn-primary btn-sm">Nuevo pedido</button></div>';
  html += '<div class="mt-3 table-responsive"><table class="table table-hover align-middle"><thead><tr><th>ID</th><th>Cliente</th><th>Dirección</th><th>Estado</th><th>Acción</th></tr></thead><tbody>';
  orders.forEach(o => {
    const badge = o.status === 'Entregado' ? 'badge-estado-activo' : (o.status === 'Enviado' ? 'badge-estado-enviada' : 'badge-estado-pendiente');
    html += '<tr data-id="' + escapeHtml(o.id) + '"><td>' + escapeHtml(o.id) + '</td><td>' + escapeHtml(o.client || '-') + '</td><td>' + escapeHtml(o.address || '-') + '</td>';
    html += '<td><span class="badge ' + badge + '">' + escapeHtml(o.status) + '</span></td>';
    html += '<td><button class="btn btn-sm btn-outline-primary btn-update">Actualizar</button></td></tr>';
  });
  html += '</tbody></table></div></div>';
  qs('#contentArea').innerHTML = html;

  qs('#btnNewOrder').addEventListener('click', async () => {
    const cliente = prompt('Cliente', 'Cliente demo') || 'Cliente demo';
    const direccion = prompt('Dirección de envío', '') || '';
    if (!direccion) return alert('La dirección de envío es obligatoria.');
    try {
      const r = await createPedido({ cliente, direccion });
      logActivity('Pedido creado: ' + r.data.codigo);
      viewPedidos();
    } catch (err) { alert(err.message); }
  });

  qsa('#contentArea .btn-update').forEach(b => b.addEventListener('click', async e => {
    const id = e.target.closest('tr').dataset.id;
    const o = orders.find(x => x.id === id); if (!o) return;
    const newS = prompt('Estado (Preparando, Enviado, Entregado)', o.status);
    if (!newS) return;
    try {
      await updatePedido(id, { estado: newS });
      logActivity('Pedido actualizado: ' + id + ' → ' + newS);
      viewPedidos();
    } catch (err) { alert(err.message); }
  }));
}

async function viewEtiquetas() {
  let orders;
  try { orders = await getPedidos(); } catch (e) { return alert(e.message); }
  let html = '<div class="card p-3"><h5 class="fw-bold">Etiquetas</h5><div class="mb-2"><select id="selOrderLabel" class="form-select"><option value="">Selecciona un pedido</option>';
  html += orders.map(o => '<option value="' + escapeHtml(o.id) + '">' + escapeHtml(o.id) + ' — ' + escapeHtml(o.status) + '</option>').join('');
  html += '</select></div><button id="btnGenLabel" class="btn btn-primary">Generar etiqueta</button></div>';
  qs('#contentArea').innerHTML = html;
  qs('#btnGenLabel').addEventListener('click', () => {
    const pid = qs('#selOrderLabel').value;
    if (!pid) return alert('Selecciona un pedido.');
    const order = orders.find(o => o.id === pid);
    const label = 'ETIQUETA DE ENVÍO\nPedido: ' + pid + '\nCliente: ' + (order ? order.client : '') + '\nDirección: ' + (order ? order.address : '') + '\nTracking: TRK-' + Math.floor(Math.random() * 900000);
    downloadText(pid + '_etiqueta.txt', label);
    logActivity('Etiqueta generada: ' + pid);
  });
}

async function viewRecibos() {
  let orders;
  try { orders = await getPedidos(); } catch (e) { return alert(e.message); }
  orders = orders.filter(o => o.status && o.status.toLowerCase().includes('entregado'));
  let html = '<div class="card p-3"><h5 class="fw-bold">Recibos de entrega</h5><div class="mb-2"><select id="selRec" class="form-select"><option value="">Selecciona entregado</option>';
  html += orders.map(o => '<option value="' + escapeHtml(o.id) + '">' + escapeHtml(o.id) + '</option>').join('');
  html += '</select></div><button id="btnPrintRec" class="btn btn-primary">Imprimir recibo</button></div>';
  qs('#contentArea').innerHTML = html;
  qs('#btnPrintRec').addEventListener('click', () => {
    const id = qs('#selRec').value;
    if (!id) return alert('Selecciona un pedido.');
    const order = orders.find(o => o.id === id);
    const win = window.open('', '_blank', 'width=600,height=500');
    if (!win) return alert('El navegador bloqueó la ventana de impresión.');
    win.document.write('<html><head><title>Recibo ' + id + '</title></head><body style="font-family:Arial;padding:30px"><h1>RECIBO DE ENTREGA</h1><p>Pedido: ' + id + '</p><p>Cliente: ' + escapeHtml(order ? order.client : '') + '</p><p>Dirección: ' + escapeHtml(order ? order.address : '') + '</p><p>Fecha: ' + new Date().toLocaleString('es-CO') + '</p><p>Firma: ____________________</p></body></html>');
    win.document.close(); win.focus();
    setTimeout(() => win.print(), 200);
    logActivity('Recibo impreso: ' + id);
  });
}

/* ---------- 14 · SOPORTE ---------- */
function viewSoporte()        { viewSoporteBase('Soporte'); }
function viewSoporteTecnico() { viewSoporteBase('Soporte Técnico'); }
function viewSoporteBase(title) {
  const tickets = load(K.tickets) || [];
  let html = '<div class="card p-3"><h5 class="fw-bold">' + escapeHtml(title) + '</h5>';
  if (!tickets.length) html += '<p class="text-muted mb-2">No hay tickets de soporte.</p>';
  else {
    html += '<div class="table-responsive"><table class="table table-hover"><thead><tr><th>Ticket</th><th>Mensaje</th><th>Fecha</th></tr></thead><tbody>';
    tickets.forEach(t => html += '<tr><td>' + escapeHtml(t.id) + '</td><td>' + escapeHtml(t.msg) + '</td><td>' + escapeHtml(formatDate(t.ts)) + '</td></tr>');
    html += '</tbody></table></div>';
  }
  html += '<button id="btnNewTicket" class="btn btn-primary btn-sm">Nuevo ticket</button></div>';
  qs('#contentArea').innerHTML = html;
  qs('#btnNewTicket').addEventListener('click', () => {
    const msg = prompt('Describe tu solicitud de soporte');
    if (!msg) return;
    const arr = load(K.tickets) || [];
    arr.unshift({ id: 'T-' + Date.now(), msg, ts: nowISO() });
    save(K.tickets, arr);
    viewSoporteBase(title);
  });
}

/* ---------- 15 · PERFIL ---------- */
function viewPerfil() {
  const u = getCurrent();
  if (!u) return alert('No has iniciado sesión.');
  const fila = (k, v) => '<div class="col-md-6 mb-2"><small class="text-muted">' + k + '</small><div>' + escapeHtml(v ?? '-') + '</div></div>';
  qs('#contentArea').innerHTML =
    '<div class="card p-4"><h5 class="fw-bold mb-3">Mi perfil</h5><div class="row">' +
    fila('Nombre', u.name + ' ' + u.lastName) + fila('Rol', u.role) +
    fila('Correo', u.email) + fila('Documento', (u.documentType || '') + ' ' + (u.document || '')) +
    fila('Dirección', u.address) + fila('Teléfono', u.phone) + '</div></div>';
}