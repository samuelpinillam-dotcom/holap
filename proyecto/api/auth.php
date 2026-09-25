<?php
// api/auth.php — register / login / current / logout
require_once __DIR__ . '/config.php';

startSecureSession();
 $action = $_GET['action'] ?? '';
 $body = jsonBody();

try {
    switch ($action) {
        case 'register': doRegister($body); break;
        case 'login':    doLogin($body);    break;
        case 'current':  doCurrent();       break;
        case 'logout':   doLogout();        break;
        default: jsonError('Acción no válida.', 404);
    }
} catch (PDOException $e) {
    if ($e->getCode() === '23000') jsonError('El correo o el documento ya está registrado.');
    jsonError('Error de base de datos: ' . $e->getMessage(), 500);
}

function validarComunes(array $b): array {
    $nombre = vStr($b, 'nombre', 80);
    $apellido = vStr($b, 'apellido', 80);
    if (!preg_match('/^[\p{L} ]+$/u', "$nombre $apellido")) jsonError('Nombre y apellido solo letras y espacios.');
    $tipo = strtoupper(vStr($b, 'tipo_documento', 5));
    if (!in_array($tipo, ['CC', 'TI', 'CE'], true)) jsonError('Tipo de documento inválido.');
    $doc = vStr($b, 'numero_documento', 20);
    if (!preg_match('/^\d{5,20}$/', $doc)) jsonError('Número de documento inválido (solo dígitos, 5 a 20).');
    $email = vEmail($b);
    $rol = vStr($b, 'rol', 30);
    if (!in_array($rol, ['Administrador', 'Empleado', 'Logística', 'Cliente'], true)) jsonError('Rol inválido.');
    $dir = vStr($b, 'direccion', 160);
    $tel = vStr($b, 'telefono', 20);
    if (!preg_match('/^\d{7,15}$/', $tel)) jsonError('Teléfono inválido (7 a 15 dígitos).');
    return [$nombre, $apellido, $tipo, $doc, $email, $rol, $dir, $tel];
}

function doRegister(array $b): void {
    [$nombre, $apellido, $tipo, $doc, $email, $rol, $dir, $tel] = validarComunes($b);
    $pass = (string)($b['password'] ?? '');
    if (strlen($pass) < 6) jsonError('La contraseña debe tener al menos 6 caracteres.');

    db()->prepare(
        'INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, email, password, rol, direccion, telefono, estado)
         VALUES (?,?,?,?,?,?,?,?,?,"Activo")'
    )->execute([$nombre, $apellido, $tipo, $doc, $email, password_hash($pass, PASSWORD_DEFAULT), $rol, $dir, $tel]);

    iniciarSesion((int)db()->lastInsertId());
}

function doLogin(array $b): void {
    $email = vEmail($b);
    $pass = (string)($b['password'] ?? '');
    $st = db()->prepare('SELECT * FROM usuarios WHERE email = ?');
    $st->execute([$email]);
    $u = $st->fetch();
    if (!$u || !password_verify($pass, $u['password'])) jsonError('Correo o contraseña incorrectos.', 401);
    if ($u['estado'] === 'Inactivo') jsonError('Tu cuenta está inactiva. Contacta al administrador.', 403);
    iniciarSesion((int)$u['id_usuario']);
}

function iniciarSesion(int $id): void {
    $st = db()->prepare('SELECT id_usuario, nombre, apellido, tipo_documento, numero_documento,
                                email, rol, direccion, telefono, estado FROM usuarios WHERE id_usuario = ?');
    $st->execute([$id]);
    $u = $st->fetch();
    session_regenerate_id(true);
    $_SESSION = ['id_usuario' => (int)$u['id_usuario'], 'nombre' => $u['nombre'],
                 'apellido' => $u['apellido'], 'email' => $u['email'], 'rol' => $u['rol']];
    jsonOk($u);
}

function doCurrent(): void {
    if (empty($_SESSION['id_usuario'])) jsonOk(null);
    $st = db()->prepare('SELECT id_usuario, nombre, apellido, tipo_documento, numero_documento,
                                email, rol, direccion, telefono, estado FROM usuarios WHERE id_usuario = ?');
    $st->execute([$_SESSION['id_usuario']]);
    $u = $st->fetch();
    if (!$u || $u['estado'] === 'Inactivo') { $_SESSION = []; jsonOk(null); }
    jsonOk($u);
}

function doLogout(): void {
    $_SESSION = [];
    session_destroy();
    jsonOk(['mensaje' => 'Sesión cerrada correctamente.']);
}