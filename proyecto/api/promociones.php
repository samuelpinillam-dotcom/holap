<?php
require __DIR__ . '/database.php';
require __DIR__ . '/_helpers.php';

 $method = $_SERVER['REQUEST_METHOD'];
 $body = jsonBody();

try {
    if ($method === 'GET') {
        requireLogin();
        if (isset($_GET['activas'])) {
            $st = db()->prepare("SELECT * FROM promociones WHERE estado='Activa'
                                 AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin ORDER BY id_promocion DESC");
            $st->execute();
            jsonOk($st->fetchAll());
        }
        jsonOk(db()->query('SELECT * FROM promociones ORDER BY id_promocion DESC')->fetchAll());
    }
    if ($method === 'POST') {
        requireRole(['Administrador']);
        $nombre = vStr($body, 'nombre', 120);
        $descuento = (int)($body['descuento'] ?? 0);
        if ($descuento < 1 || $descuento > 100) jsonError('El descuento debe estar entre 1 y 100%.');
        $ini = vStr($body, 'fecha_inicio', 10); $fin = vStr($body, 'fecha_fin', 10);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $ini) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fin)) jsonError('Fechas inválidas (AAAA-MM-DD).');
        if ($fin < $ini) jsonError('La fecha final no puede ser anterior a la inicial.');
        db()->prepare('INSERT INTO promociones (nombre, descuento, fecha_inicio, fecha_fin) VALUES (?,?,?,?)')
            ->execute([$nombre, $descuento, $ini, $fin]);
        jsonOk(['id_promocion' => (int)db()->lastInsertId()]);
    }
    if ($method === 'PUT') {
        requireRole(['Administrador']);
        $id = (int)($body['id_promocion'] ?? 0);
        if ($id <= 0) jsonError('Promoción no especificada.');
        if (isset($body['descuento']) && ((int)$body['descuento'] < 1 || (int)$body['descuento'] > 100))
            jsonError('Descuento entre 1 y 100%.');
        [$sets, $vals] = buildUpdate($body, [
            'nombre' => 'str', 'descuento' => 'int', 'fecha_inicio' => 'str', 'fecha_fin' => 'str',
            'estado' => ['Activa', 'Inactiva']
        ]);
        $vals[] = $id;
        db()->prepare("UPDATE promociones SET $sets WHERE id_promocion = ?")->execute($vals);
        jsonOk(['actualizado' => true]);
    }
    if ($method === 'DELETE') {
        requireRole(['Administrador']);
        db()->prepare('DELETE FROM promociones WHERE id_promocion = ?')->execute([(int)($_GET['id'] ?? 0)]);
        jsonOk(['eliminado' => true]);
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) {
    jsonError('Error de BD: ' . $e->getMessage(), 500);
}