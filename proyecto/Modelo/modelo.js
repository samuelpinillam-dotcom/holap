/* =========================================================
   Lyon Technologies · Modelo/modelo.js  (CORREGIDO)
   Capa de datos asíncrona: fetch → api/*.php → MySQL.
   Se carga ANTES de vista.js y controlador.js.
   ========================================================= */
const API_BASE = 'api/';
let _sesion = null;

/* ---------- api(): robusta — nunca más errores crípticos ---------- */
async function api(endpoint, { method = 'GET', body = null } = {}) {
  const opts = { method, credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } };
  if (body !== null) opts.body = JSON.stringify(body);

  let res, raw;
  try {
    res = await fetch(API_BASE + endpoint, opts);
    raw = await res.text();                 // SIEMPRE leer como texto primero
  } catch (e) {
    throw new Error('No se pudo conectar con el servidor (' + API_BASE + endpoint + '). ' +
      'Verifica que Apache esté encendido y que abres la página con http://localhost (no con Live Server ni file://).');
  }

  let data = null;
  try { data = JSON.parse(raw); }
  catch (_) {
    // El servidor NO respondió JSON → mostrar qué dijo realmente
    const pista = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
    if (pista.startsWith('<?php')) {
      throw new Error('El PHP no se está ejecutando (el navegador recibió el código crudo). ' +
        'Abre la página con http://localhost/LyonTech/ con Apache encendido, NO con Live Server.');
    }
    throw new Error('El servidor no respondió JSON válido. ' +
      (pista ? 'Dice: "' + pista + '"' : 'Código HTTP ' + res.status));
  }

  if (!res.ok || data.ok === false) throw new Error(data.error || ('Error HTTP ' + res.status));
  return data; // { ok: true, data: ... }
}

/* ---------- Utilidades compartidas ---------- */
function qs(s){ return document.querySelector(s); }
function qsa(s){ return Array.from(document.querySelectorAll(s)); }
function escapeHtml(s){ return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtMoney(n){ return '$ ' + Math.round(Number(n) || 0).toLocaleString('es-CO'); }
function nowISO(){ return new Date().toISOString(); }
function formatDate(ts){ return new Date(ts).toLocaleString('es-CO'); }
function genId(){ return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2,8); }
function downloadText(filename, text){
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}
function getCurrent(){ return _sesion; }

/* ---------- Mapeo BD (snake_case) → frontend (camelCase) ---------- */
const mapUsuario = r => {
  if (!r) throw new Error('El servidor no devolvió los datos del usuario.');
  return { id:+r.id_usuario, name:r.nombre, lastName:r.apellido,
    documentType:r.tipo_documento, document:r.numero_documento, email:r.email, role:r.rol,
    address:r.direccion, phone:r.telefono, status:r.estado };
};
const mapProducto = r => ({ id:+r.id_producto, name:r.nombre, desc:r.descripcion,
  price:+r.precio, cost:+r.costo, qty:+r.cantidad, min:+r.stock_minimo, status:r.estado });
const mapCliente = r => ({ id:+r.id_cliente, name:r.nombre, email:r.email, phone:r.telefono });
const mapProveedor = r => ({ id:+r.id_proveedor, name:r.nombre, contact:r.contacto, items:r.productos });
const mapPromo = r => ({ id:+r.id_promocion, name:r.nombre, discount:+r.descuento,
  start:r.fecha_inicio, end:r.fecha_fin, status:r.estado });
const mapVenta = r => ({ id:+r.id_venta, number:r.numero,
  clientId: r.id_cliente ? +r.id_cliente : '', clientName:r.cliente_nombre || 'Cliente general',
  subtotal:+r.subtotal, discount:+r.descuento, iva:+r.iva, total:+r.total,
  promotionId: r.id_promocion ? +r.id_promocion : '',
  date:(r.fecha || '').replace(' ', 'T'), invoiceStatus:r.estado,
  items:(r.items || []).map(it => ({ id:+it.id_item, productId: it.id_producto ? +it.id_producto : null,
    name:it.nombre, price:+it.precio, qty:+it.cantidad })) });
const mapDevolucion = r => ({ id:+r.id_devolucion, saleId:+r.id_venta, saleNumber:r.venta_numero,
  productId: r.id_producto ? +r.id_producto : null, productName:r.producto_nombre, qty:+r.cantidad,
  reason:r.motivo, status:r.estado, creditNote:r.nota_credito || '' });
const mapPedido = r => ({ id:'P-' + r.id_pedido, client:r.cliente, address:r.direccion, status:r.estado, date:r.fecha });

/* ---------- Autenticación ---------- */
async function apiRegister(f){
  const r = await api('auth.php?action=register', { method:'POST', body:f });
  _sesion = mapUsuario(r.data);
  return _sesion;
}
async function apiLogin(email, password){
  const r = await api('auth.php?action=login', { method:'POST', body:{ email, password } });
  _sesion = mapUsuario(r.data);
  return _sesion;
}
async function apiCurrent(){
  try { const r = await api('auth.php?action=current'); _sesion = r.data ? mapUsuario(r.data) : null; }
  catch(_) { _sesion = null; }
  return _sesion;
}
async function apiLogout(){ try { await api('auth.php?action=logout'); } catch(_){} _sesion = null; }

/* ---------- CRUD por módulo ---------- */
// Usuarios
const getUsuarios    = async () => (await api('usuarios.php')).data.map(mapUsuario);
const createUsuario  = u => api('usuarios.php', { method:'POST', body:u });
const updateUsuario  = (id, c) => api('usuarios.php', { method:'PUT', body:{ id_usuario:id, ...c } });
const deleteUsuario  = id => api('usuarios.php?id=' + id, { method:'DELETE' });
// Productos
const getProductos   = async () => (await api('productos.php')).data.map(mapProducto);
const createProducto = p => api('productos.php', { method:'POST', body:p });
const updateProducto = (id, c) => api('productos.php', { method:'PUT', body:{ id_producto:id, ...c } });
const deleteProducto = id => api('productos.php?id=' + id, { method:'DELETE' });
// Clientes
const getClientes    = async () => (await api('clientes.php')).data.map(mapCliente);
const createCliente  = c => api('clientes.php', { method:'POST', body:c });
const updateCliente  = (id, c) => api('clientes.php', { method:'PUT', body:{ id_cliente:id, ...c } });
const deleteCliente  = id => api('clientes.php?id=' + id, { method:'DELETE' });
// Proveedores
const getProveedores    = async () => (await api('proveedores.php')).data.map(mapProveedor);
const createProveedor   = p => api('proveedores.php', { method:'POST', body:p });
const updateProveedor   = (id, c) => api('proveedores.php', { method:'PUT', body:{ id_proveedor:id, ...c } });
const deleteProveedor   = id => api('proveedores.php?id=' + id, { method:'DELETE' });
// Promociones
const getPromociones   = async () => (await api('promociones.php')).data.map(mapPromo);
const createPromocion  = p => api('promociones.php', { method:'POST', body:p });
const updatePromocion  = (id, c) => api('promociones.php', { method:'PUT', body:{ id_promocion:id, ...c } });
const deletePromocion  = id => api('promociones.php?id=' + id, { method:'DELETE' });
async function getActivePromotions(){
  const today = new Date().toISOString().slice(0, 10);
  return (await getPromociones()).filter(p => p.status === 'Activa' && p.start <= today && p.end >= today);
}
// Pedidos
const getPedidos   = async () => (await api('pedidos.php')).data.map(mapPedido);
const createPedido = p => api('pedidos.php', { method:'POST', body:p });
const updatePedido = (id, c) => api('pedidos.php', { method:'PUT', body:{ id, ...c } });
// Ventas
const getVentas   = async (mine=false) => (await api('ventas.php' + (mine ? '?mine=1' : ''))).data.map(mapVenta);
const createVenta = v => api('ventas.php', { method:'POST', body:v });
const accionVenta = (id, accion) => api('ventas.php', { method:'PUT', body:{ id_venta:id, accion } });
// Devoluciones
const getDevoluciones   = async () => (await api('devoluciones.php')).data.map(mapDevolucion);
const createDevolucion  = d => api('devoluciones.php', { method:'POST', body:d });
const accionDevolucion  = (id, accion) => api('devoluciones.php', { method:'PUT', body:{ id_devolucion:id, accion } });

/* ---------- Cálculo de factura (espejo del servidor) ---------- */
function calculateInvoice(subtotal, promotionId, promotions){
  const promo = (promotions || []).find(p => String(p.id) === String(promotionId) && p.status === 'Activa');
  const discount = promo ? subtotal * (Number(promo.discount) || 0) / 100 : 0;
  const base = subtotal - discount;
  const iva = base * 0.19;
  return { subtotal, discount, iva, total: base + iva, promotion: promo || null };
}

/* ---------- Actividad (bitácora en la BD, fire & forget) ---------- */
function logActivity(txt){
  fetch(API_BASE + 'actividad.php', { method:'POST', credentials:'same-origin',
    headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ texto: txt }) }).catch(() => {});
}
async function getActivity(){
  try { return (await api('actividad.php')).data.map(a => ({ ts:(a.fecha || '').replace(' ', 'T'), txt:a.texto })); }
  catch(_) { return []; }
}

/* ---------- Legacy: Soporte (única vista aún en localStorage) ---------- */
const K = { users:'lt_users', products:'lt_products', clients:'lt_clients', providers:'lt_providers',
  sales:'lt_sales', promotions:'lt_promotions', devolutions:'lt_devolutions',
  orders:'lt_orders', activity:'lt_activity', tickets:'lt_tickets' };
function load(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(_) { return null; } }
function save(k, v){ localStorage.setItem(k, JSON.stringify(v)); }