<?php
require __DIR__ . '/database.php';
require __DIR__ . '/_helpers.php';

 $method = $_SERVER['REQUEST_METHOD'];
 $body = jsonBody();

try {
    if ($method === 'GET') {
        requireLogin();
        jsonOk(db()->query('SELECT * FROM productos ORDER BY id_producto DESC')->fetchAll());
    }
    if ($method === 'POST') {
        requireRole(['Administrador', 'Empleado']);
        $nombre = vStr($body, 'nombre', 120);
        $desc = trim((string)($body['descripcion'] ?? ''));
        db()->prepare('INSERT INTO productos (nombre, descripcion, precio, costo, cantidad, stock_minimo) VALUES (?,?,?,?,?,?)')
            ->execute([$nombre, $desc, vNum($body,'precio'), vNum($body,'costo'),
                       (int)vNum($body,'cantidad'), (int)vNum($body,'stock_minimo')]);
        jsonOk(['id_producto' => (int)db()->lastInsertId()]);
    }
    if ($method === 'PUT') {
        requireRole(['Administrador', 'Empleado']);
        $id = (int)($body['id_producto'] ?? 0);
        if ($id <= 0) jsonError('Producto no especificado.');
        [$sets, $vals] = buildUpdate($body, [
            'nombre' => 'str', 'descripcion' => 'str_opt', 'precio' => 'float', 'costo' => 'float',
            'cantidad' => 'int', 'stock_minimo' => 'int', 'estado' => ['Activo', 'Inactivo']
        ]);
        $vals[] = $id;
        db()->prepare("UPDATE productos SET $sets WHERE id_producto = ?")->execute($vals);
        jsonOk(['actualizado' => true]);
    }
    if ($method === 'DELETE') {
        requireRole(['Administrador']);
        db()->prepare('DELETE FROM productos WHERE id_producto = ?')->execute([(int)($_GET['id'] ?? 0)]);
        jsonOk(['eliminado' => true]);
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) {
    jsonError('Error de BD: ' . $e->getMessage(), 500);
}