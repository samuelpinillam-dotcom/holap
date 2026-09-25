<?php
require __DIR__ . '/database.php';
require __DIR__ . '/_helpers.php';

 $method = $_SERVER['REQUEST_METHOD'];
 $body = jsonBody();

try {
    if ($method === 'GET') {
        requireRole(['Logística', 'Administrador']);
        jsonOk(db()->query('SELECT * FROM pedidos ORDER BY id_pedido DESC')->fetchAll());
    }
    if ($method === 'POST') {
        requireRole(['Logística', 'Administrador']);
        $cliente = vStr($body, 'cliente', 160);
        $direccion = vStr($body, 'direccion', 200);
        db()->prepare('INSERT INTO pedidos (cliente, direccion) VALUES (?,?)')->execute([$cliente, $direccion]);
        jsonOk(['id_pedido' => (int)db()->lastInsertId(), 'codigo' => 'P-' . db()->lastInsertId()]);
    }
    if ($method === 'PUT') {
        requireRole(['Logística', 'Administrador']);
        $id = (int)filter_var($body['id'] ?? '', FILTER_SANITIZE_NUMBER_INT); // acepta 'P-12' o 12
        if ($id <= 0) jsonError('Pedido no especificado.');
        $estado = $body['estado'] ?? '';
        if (!in_array($estado, ['Preparando', 'Enviado', 'Entregado'], true)) jsonError('Estado inválido.');
        db()->prepare('UPDATE pedidos SET estado = ? WHERE id_pedido = ?')->execute([$estado, $id]);
        jsonOk(['actualizado' => true]);
    }
    if ($method === 'DELETE') {
        requireRole(['Logística', 'Administrador']);
        $id = (int)filter_var($_GET['id'] ?? '', FILTER_SANITIZE_NUMBER_INT);
        db()->prepare('DELETE FROM pedidos WHERE id_pedido = ?')->execute([$id]);
        jsonOk(['eliminado' => true]);
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) {
    jsonError('Error de BD: ' . $e->getMessage(), 500);
}