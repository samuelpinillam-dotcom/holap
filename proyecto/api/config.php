<?php
// api/config.php — TODO el backend base en un solo archivo:
// manejo de errores fatales + helpers + conexión a MySQL.

// 1) Convertir errores fatales de PHP en JSON legible
register_shutdown_function(function () {
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        http_response_code(500);
        while (ob_get_level() > 0) { ob_end_clean(); }
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok'    => false,
            'error' => 'Error PHP: ' . $e['message'] . ' — archivo: ' . basename($e['file']) . ', línea ' . $e['line']
        ], JSON_UNESCAPED_UNICODE);
    }
});

// 2) Respuestas JSON
function jsonOut($data, int $code = 200): void {
    http_response_code($code);
    while (ob_get_level() > 0) { ob_end_clean(); }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function jsonOk($data = null): void               { jsonOut(['ok' => true, 'data' => $data]); }
function jsonError(string $m, int $c = 400): void { jsonOut(['ok' => false, 'error' => $m], $c); }

function jsonBody(): array {
    $d = json_decode(file_get_contents('php://input') ?: '[]', true);
    return is_array($d) ? $d : [];
}

// 3) Sesión segura
function startSecureSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
        session_start();
    }
}
function requireLogin(): array {
    startSecureSession();
    if (empty($_SESSION['id_usuario'])) jsonError('No autorizado: inicia sesión.', 401);
    return $_SESSION;
}
function requireRole(array $roles): array {
    $s = requireLogin();
    if (!in_array($s['rol'] ?? '', $roles, true)) jsonError('No tienes permisos para esta acción.', 403);
    return $s;
}

// 4) Validación de entradas
function vStr(array $b, string $k, int $max = 255): string {
    $v = trim((string)($b[$k] ?? ''));
    if ($v === '' || mb_strlen($v) > $max) jsonError("El campo '$k' es obligatorio (máx. $max).");
    return $v;
}
function vEmail(array $b): string {
    $v = filter_var(trim((string)($b['email'] ?? '')), FILTER_VALIDATE_EMAIL);
    if (!$v) jsonError('Correo electrónico inválido.');
    return strtolower($v);
}
function vNum(array $b, string $k, float $min = 0): float {
    if (!isset($b[$k]) || !is_numeric($b[$k]) || (float)$b[$k] < $min) jsonError("El campo '$k' debe ser un número >= $min.");
    return (float)$b[$k];
}
function buildUpdate(array $body, array $allowed): array {
    $sets = []; $vals = [];
    foreach ($allowed as $campo => $regla) {
        if (!array_key_exists($campo, $body)) continue;
        $v = $body[$campo];
        if (is_array($regla)) {
            if (!in_array($v, $regla, true)) jsonError("Valor inválido para '$campo'.");
        } elseif ($regla === 'str') {
            $v = trim((string)$v);
            if ($v === '') jsonError("El campo '$campo' no puede estar vacío.");
        } elseif ($regla === 'str_opt') {
            $v = trim((string)$v);
        } elseif ($regla === 'int' || $regla === 'float') {
            $v = $regla === 'int' ? (int)$v : (float)$v;
            if ($v < 0) jsonError("El campo '$campo' no puede ser negativo.");
        }
        $sets[] = "`$campo` = ?";
        $vals[] = $v;
    }
    if (!$sets) jsonError('No hay campos para actualizar.');
    return [implode(', ', $sets), $vals];
}

// 5) Conexión a la base de datos (AQUÍ vive la función db())
define('DB_HOST', 'localhost');
define('DB_NAME', 'Tienda_Electrodomesticos');
define('DB_USER', 'root');
define('DB_PASS', '');   // ← pon tu contraseña de MySQL si tienes una

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]
            );
        } catch (PDOException $e) {
            jsonOut(['ok' => false, 'error' => 'No se pudo conectar a MySQL. Revisa DB_USER/DB_PASS en api/config.php y que la BD Tienda_Electrodomesticos exista (importa sql/schema.sql).'], 500);
        }
    }
    return $pdo;
}