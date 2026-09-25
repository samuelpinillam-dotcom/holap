<?php
require __DIR__ . '/database.php';
require __DIR__ . '/_helpers.php';

 $method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'POST') {
        requireLogin();
        $texto = vStr(jsonBody(), 'texto', 255);
        db()->prepare('INSERT INTO actividad (texto) VALUES (?)')->execute([$texto]);
        jsonOk();
    }
    if ($method === 'GET') {
        requireRole(['Administrador']);
        jsonOk(db()->query('SELECT texto, fecha FROM actividad ORDER BY id_actividad DESC LIMIT 40')->fetchAll());
    }
    jsonError('Método no permitido.', 405);
} catch (PDOException $e) {
    jsonError('Error de BD: ' . $e->getMessage(), 500);
}