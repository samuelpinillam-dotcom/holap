<?php
require __DIR__ . '/database.php';
require __DIR__ . '/_helpers.php';

const ROLES = ['Administrador', 'Empleado', 'Logística', 'Cliente'];
 $method = $_SERVER['REQUEST_METHOD'];
 $body = jsonBody();

try {
    if ($method === 'GET') {
        requireRole(['Administrador']);
        jsonOk(db()->query('SELECT id_usuario, nombre, apellido, tipo_documento, numero_documento,
                                   email, rol, direccion, telefono, estado, fecha_registro
                            FROM usuarios ORDER BY id_usuario DESC')->fetchAll());
    }
    if ($method === 'POST')  { requireRole(['Administrador']); crearUsuario($body); }
    if ($method === 'PUT')   { requireRole(['Administrador']); editarUsuario($body); }
    if ($method === 'DELETE') {
        $s = requireRole(['Administrador']);
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) jsonError('Usuario no especificado.');
        if ($id === (int)$s['id_usuario']) jsonError('No puedes eliminar tu propia cuenta.');
        db()->prepare('DELETE FROM usuarios WHERE id_usuario = ?')->execute([$id]);
        jsonOk(['eliminado' => true]);
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') jsonError('El correo o documento ya existe.');
    jsonError('Error de BD: ' . $e->getMessage(), 500);
}

function crearUsuario(array $b): void {
    [$nombre, $apellido, $tipo, $doc, $email, $rol, $dir, $tel] = validarAuth($b);
    $pass = (string)($b['password'] ?? '');
    if (strlen($pass) < 6) jsonError('Contraseña: mínimo 6 caracteres.');
    db()->prepare('INSERT INTO usuarios (nombre, apellido, tipo_documento, numero_documento, email, password, rol, direccion, telefono, estado)
                   VALUES (?,?,?,?,?,?,?,?,?,"Activo")')
        ->execute([$nombre, $apellido, $tipo, $doc, $email, password_hash($pass, PASSWORD_DEFAULT), $rol, $dir, $tel]);
    jsonOk(['id_usuario' => (int)db()->lastInsertId()]);
}

function validarAuth(array $b): array {
    $nombre = vStr($b, 'nombre', 80);
    $apellido = vStr($b, 'apellido', 80);
    if (!preg_match('/^[\p{L} ]+$/u', "$nombre $apellido")) jsonError('Nombre y apellido solo letras.');
    $tipo = strtoupper(vStr($b, 'tipo_documento', 5));
    if (!in_array($tipo, ['CC','TI','CE'], true)) jsonError('Tipo de documento inválido.');
    $doc = vStr($b, 'numero_documento', 20);
    if (!preg_match('/^\d{5,20}$/', $doc)) jsonError('Documento inválido.');
    $email = vEmail($b);
    $rol = vStr($b, 'rol', 30);
    if (!in_array($rol, ROLES, true)) jsonError('Rol inválido.');
    $dir = vStr($b, 'direccion', 160);
    $tel = vStr($b, 'telefono', 20);
    if (!preg_match('/^\d{7,15}$/', $tel)) jsonError('Teléfono inválido (7-15 dígitos).');
    return [$nombre, $apellido, $tipo, $doc, $email, $rol, $dir, $tel];
}

function editarUsuario(array $b): void {
    $id = (int)($b['id_usuario'] ?? 0);
    if ($id <= 0) jsonError('Usuario no especificado.');
    [$sets, $vals] = buildUpdate($b, [
        'nombre' => 'str', 'apellido' => 'str', 'direccion' => 'str_opt', 'telefono' => 'str_opt',
        'rol' => ROLES, 'estado' => ['Activo', 'Inactivo']
    ]);
    $vals[] = $id;
    db()->prepare("UPDATE usuarios SET $sets WHERE id_usuario = ?")->execute($vals);
    jsonOk(['actualizado' => true]);
}