<?php
require __DIR__ . '/database.php';
require __DIR__ . '/_helpers.php';

 $method = $_SERVER['REQUEST_METHOD'];
 $body = jsonBody();

try {
    $s = requireLogin();

    if ($method === 'GET') {
        $mine = isset($_GET['mine']) || $s['rol'] === 'Cliente'; // un cliente solo ve SUS compras
        $sql = 'SELECT * FROM ventas' . ($mine ? ' WHERE id_usuario = ?' : '') . ' ORDER BY id_venta DESC';
        $st = db()->prepare($sql);
        $st->execute($mine ? [$s['id_usuario']] : []);
        $ventas = $st->fetchAll();

        $porVenta = [];
        foreach (db()->query('SELECT * FROM venta_items ORDER BY id_item')->fetchAll() as $it)
            $porVenta[$it['id_venta']][] = $it;
        foreach ($ventas as &$v) $v['items'] = $porVenta[$v['id_venta']] ?? [];
        jsonOk($ventas);
    }

    if ($method === 'POST') registrarVenta($body, $s);

    if ($method === 'PUT') {
        requireRole(['Administrador', 'Empleado']);
        $id = (int)($body['id_venta'] ?? 0);
        $accion = $body['accion'] ?? '';
        if ($id <= 0) jsonError('Venta no especificada.');
        if ($accion === 'anular') {
            $st = db()->prepare("UPDATE ventas SET estado='Anulada' WHERE id_venta=? AND estado <> 'Anulada'");
            $st->execute([$id]);
            if (!$st->rowCount()) jsonError('La factura ya está anulada o no existe.');
            jsonOk(['anulada' => true]);
        }
        if ($accion === 'enviar') {
            $st = db()->prepare("UPDATE ventas SET estado='Enviada' WHERE id_venta=? AND estado='Activa'");
            $st->execute([$id]);
            if (!$st->rowCount()) jsonError('Solo se pueden enviar facturas activas.');
            jsonOk(['enviada' => true]);
        }
        jsonError('Acción no válida.');
    }

    jsonError('Método no permitido.', 405);
} catch (PDOException $e) {
    jsonError('Error de BD: ' . $e->getMessage(), 500);
}

function registrarVenta(array $b, array $s): void {
    $idProducto = (int)($b['id_producto'] ?? 0);
    $cantidad   = (int)($b['cantidad'] ?? 0);
    $idCliente  = (int)($b['id_cliente'] ?? 0) ?: null;
    $idPromo    = (int)($b['id_promocion'] ?? 0) ?: null;
    if ($idProducto <= 0 || $cantidad <= 0) jsonError('Producto y cantidad son obligatorios.');

    $pdo = db();
    $pdo->beginTransaction();
    try {
        $st = $pdo->prepare('SELECT * FROM productos WHERE id_producto = ? FOR UPDATE');
        $st->execute([$idProducto]);
        $p = $st->fetch();
        if (!$p || $p['estado'] === 'Inactivo') { $pdo->rollBack(); jsonError('Producto no disponible.'); }
        if ((int)$p['cantidad'] < $cantidad)   { $pdo->rollBack(); jsonError('No hay suficiente stock.'); }

        $clienteNombre = $s['nombre'] . ' ' . $s['apellido'];
        if ($idCliente) {
            $st = $pdo->prepare('SELECT nombre FROM clientes WHERE id_cliente = ?');
            $st->execute([$idCliente]);
            $c = $st->fetch();
            if (!$c) { $pdo->rollBack(); jsonError('Cliente no encontrado.'); }
            $clienteNombre = $c['nombre'];
        }

        $descuentoValor = 0.0;
        if ($idPromo) {
            $st = $pdo->prepare("SELECT * FROM promociones WHERE id_promocion=? AND estado='Activa'
                                 AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_fin");
            $st->execute([$idPromo]);
            $promo = $st->fetch();
            if ($promo) $descuentoValor = round($p['precio'] * $cantidad * (int)$promo['descuento'] / 100, 2);
            else $idPromo = null;
        }

        $subtotal = round($p['precio'] * $cantidad, 2);
        $base  = $subtotal - $descuentoValor;
        $iva   = round($base * 0.19, 2);
        $total = round($base + $iva, 2);
        $numero = 'FAC-' . date('ymd') . '-' . random_int(100, 999);

        $st = $pdo->prepare('INSERT INTO ventas (numero, id_cliente, id_usuario, cliente_nombre, subtotal, descuento, iva, total, id_promocion)
                             VALUES (?,?,?,?,?,?,?,?,?)');
        $st->execute([$numero, $idCliente, $s['id_usuario'], $clienteNombre, $subtotal, $descuentoValor, $iva, $total, $idPromo]);
        $idVenta = (int)$pdo->lastInsertId();

        $pdo->prepare('INSERT INTO venta_items (id_venta, id_producto, nombre, precio, cantidad) VALUES (?,?,?,?,?)')
            ->execute([$idVenta, $idProducto, $p['nombre'], $p['precio'], $cantidad]);
        $pdo->prepare('UPDATE productos SET cantidad = cantidad - ? WHERE id_producto = ?')
            ->execute([$cantidad, $idProducto]);

        $pdo->commit();
        jsonOk(['id_venta' => $idVenta, 'numero' => $numero, 'subtotal' => $subtotal,
                'descuento' => $descuentoValor, 'iva' => $iva, 'total' => $total]);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}