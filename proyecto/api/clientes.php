<?php
require __DIR__ . '/database.php';
require __DIR__ . '/_helpers.php';

 $method = $_SERVER['REQUEST_METHOD'];
 $body = jsonBody();

try {
    if ($method === 'GET') {
        requireRole(['Administrador', 'Empleado']);
        jsonOk(db()->query('SELECT * FROM clientes ORDER BY id_cliente DESC')->fetchAll());
    }
    if ($method === 'POST') {
        requireRole(['Administrador', 'Empleado']);
        $nombre = vStr($body, 'nombre', 120);
        $email = trim((string)($body['email'] ?? ''));
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError('Correo inválido.');
        $tel = trim((string)($body['telefono'] ?? ''));
        if ($tel !== '' && !preg_match('/^\d{7,15}$/', $tel)) jsonError('Teléfono inválido.');
        db()->prepare('INSERT INTO clientes (nombre, email, telefono) VALUES (?,?,?)')->execute([$nombre, $email, $tel]);
        jsonOk(['id_cliente' => (int)db()->lastInsertId()]);
    }
    if ($method === 'PUT') {
        requireRole(['Administrador', 'Empleado']);
        $id = (int)($body['id_cliente'] ?? 0);
        if ($id <= 0) jsonError('Cliente no especificado.');
        [$sets, $vals] = buildUpdate($body, ['nombre' => 'str', 'email' => 'str_opt', 'telefono' => 'str_opt']);
        $vals[] = $id;
        db()->prepare("UPDATE clientes SET $sets WHERE id_cliente = ?")->execute($vals);
        jsonOk(['actualizado' => true]);
    }
    if ($method === 'DELETE') {
        requireRole(['Administrador', 'Empleado']);
        db()->prepare('DELETE FROM clientes WHERE id_cliente = ?')->execute([(int)($_GET['id'] ?? 0)]);
        jsonOk(['eliminado' => true]);
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) {
    jsonError('Error de BD: ' . $e->getMessage(), 500);
}