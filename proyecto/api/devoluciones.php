<?php
require __DIR__ . '/database.php';
require __DIR__ . '/_helpers.php';

 $method = $_SERVER['REQUEST_METHOD'];
 $body = jsonBody();

try {
    if ($method === 'GET') {
        requireRole(['Administrador', 'Empleado']);
        jsonOk(db()->query('SELECT * FROM devoluciones ORDER BY id_devolucion DESC')->fetchAll());
    }

    if ($method === 'POST') {
        requireRole(['Administrador', 'Empleado']);
        $idVenta = (int)($body['id_venta'] ?? 0);
        $idItem  = (int)($body['id_item'] ?? 0);
        $cantidad = (int)($body['cantidad'] ?? 0);
        $motivo = vStr($body, 'motivo', 255);
        if ($idVenta <= 0 || $idItem <= 0 || $cantidad <= 0) jsonError('Factura, producto y cantidad son obligatorios.');

        $st = db()->prepare('SELECT v.estado, v.numero, i.id_producto, i.nombre, i.cantidad
                             FROM ventas v JOIN venta_items i ON i.id_venta = v.id_venta
                             WHERE v.id_venta = ? AND i.id_item = ?');
        $st->execute([$idVenta, $idItem]);
        $row = $st->fetch();
        if (!$row) jsonError('La factura o el producto no existen.');
        if ($row['estado'] === 'Anulada') jsonError('No se pueden devolver productos de una factura anulada.');
        if ($cantidad > (int)$row['cantidad']) jsonError('La cantidad excede lo comprado en la factura.');

        db()->prepare('INSERT INTO devoluciones (id_venta, venta_numero, id_item, id_producto, producto_nombre, cantidad, motivo)
                       VALUES (?,?,?,?,?,?,?)')
            ->execute([$idVenta, $row['numero'], $idItem, $row['id_producto'], $row['nombre'], $cantidad, $motivo]);
        jsonOk(['id_devolucion' => (int)db()->lastInsertId()]);
    }

    if ($method === 'PUT') {
        requireRole(['Administrador', 'Empleado']);
        $id = (int)($body['id_devolucion'] ?? 0);
        $accion = $body['accion'] ?? '';
        if ($id <= 0) jsonError('Devolución no especificada.');

        $st = db()->prepare('SELECT * FROM devoluciones WHERE id_devolucion = ?');
        $st->execute([$id]);
        $d = $st->fetch();
        if (!$d) jsonError('Devolución no encontrada.', 404);

        if ($accion === 'validar') {
            if ($d['estado'] !== 'Pendiente') jsonError('La devolución ya fue validada.');
            $pdo = db();
            $pdo->beginTransaction();
            try {
                $pdo->prepare("UPDATE devoluciones SET estado='Validada' WHERE id_devolucion=?")->execute([$id]);
                if ($d['id_producto']) {
                    $pdo->prepare('UPDATE productos SET cantidad = cantidad + ? WHERE id_producto = ?')
                        ->execute([(int)$d['cantidad'], $d['id_producto']]);
                }
                $pdo->commit();
            } catch (Exception $e) { $pdo->rollBack(); throw $e; }
            jsonOk(['validada' => true]);
        }

        if ($accion === 'nota') {
            if ($d['estado'] !== 'Validada') jsonError('Primero debes validar la devolución.');
            if (!empty($d['nota_credito'])) jsonError('Ya tiene nota de crédito: ' . $d['nota_credito']);
            $nc = 'NC-' . date('ymd') . '-' . random_int(100, 999);
            db()->prepare('UPDATE devoluciones SET nota_credito = ? WHERE id_devolucion = ?')->execute([$nc, $id]);
            jsonOk(['nota_credito' => $nc]);
        }
        jsonError('Acción no válida.');
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) {
    jsonError('Error de BD: ' . $e->getMessage(), 500);
}