<?php
require __DIR__ . '/database.php';
require __DIR__ . '/_helpers.php';

 $method = $_SERVER['REQUEST_METHOD'];
 $body = jsonBody();

try {
    if ($method === 'GET') {
        requireRole(['Administrador', 'Logística']);
        jsonOk(db()->query('SELECT * FROM proveedores ORDER BY id_proveedor DESC')->fetchAll());
    }
    if ($method === 'POST') {
        requireRole(['Administrador', 'Logística']);
        $nombre = vStr($body, 'nombre', 120);
        db()->prepare('INSERT INTO proveedores (nombre, contacto, productos) VALUES (?,?,?)')
            ->execute([$nombre, trim((string)($body['contacto'] ?? '')), trim((string)($body['productos'] ?? ''))]);
        jsonOk(['id_proveedor' => (int)db()->lastInsertId()]);
    }
    if ($method === 'PUT') {
        requireRole(['Administrador', 'Logística']);
        $id = (int)($body['id_proveedor'] ?? 0);
        if ($id <= 0) jsonError('Proveedor no especificado.');
        [$sets, $vals] = buildUpdate($body, ['nombre' => 'str', 'contacto' => 'str_opt', 'productos' => 'str_opt']);
        $vals[] = $id;
        db()->prepare("UPDATE proveedores SET $sets WHERE id_proveedor = ?")->execute($vals);
        jsonOk(['actualizado' => true]);
    }
    if ($method === 'DELETE') {
        requireRole(['Administrador', 'Logística']);
        db()->prepare('DELETE FROM proveedores WHERE id_proveedor = ?')->execute([(int)($_GET['id'] ?? 0)]);
        jsonOk(['eliminado' => true]);
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) {
    jsonError('Error de BD: ' . $e->getMessage(), 500);
}