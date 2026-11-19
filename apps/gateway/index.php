<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// Cargar variables del archivo .env del gateway si existe
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
            continue;
        }
        [$k, $v] = explode('=', $trimmed, 2);
        $k = trim($k);
        $v = trim($v, " \t\n\r\0\x0B\"'");
        $_ENV[$k] = $v;
    }
}

$backendUrl   = rtrim($_ENV['BACKEND_INTERNAL_URL'] ?? 'http://127.0.0.1:3000', '/');
$gatewayToken = trim($_ENV['INTERNAL_GATEWAY_TOKEN'] ?? '');
$method       = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$requestUri   = $_SERVER['REQUEST_URI'] ?? '/';
$path         = parse_url($requestUri, PHP_URL_PATH) ?: '/';

if ($path === '/gateway/health') {
    http_response_code(200);
    echo json_encode(['status' => 'OK', 'gateway' => 'PHP API Gateway activo']);
    exit;
}

// Obtener la IP real del cliente para que Express aplique el rate limit por usuario y no uno global
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$forwardedFor = !empty($_SERVER['HTTP_X_FORWARDED_FOR'])
    ? $_SERVER['HTTP_X_FORWARDED_FOR'] . ', ' . $clientIp
    : $clientIp;

// Reenviar cabeceras clave (Authorization, Content-Type, IP del cliente y Token interno)
$headers = [
    'Accept: application/json',
    'Connection: close',
    'X-Real-IP: ' . $clientIp,
    'X-Forwarded-For: ' . $forwardedFor,
];

if ($gatewayToken !== '') {
    $headers[] = 'X-Gateway-Token: ' . $gatewayToken;
}

if (!empty($_SERVER['CONTENT_TYPE'])) {
    $headers[] = 'Content-Type: ' . $_SERVER['CONTENT_TYPE'];
}

$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
if ($auth === '' && function_exists('apache_request_headers')) {
    $reqHeaders = apache_request_headers();
    $auth = $reqHeaders['Authorization'] ?? $reqHeaders['authorization'] ?? '';
}
if ($auth !== '') {
    $headers[] = 'Authorization: ' . $auth;
}

$body = file_get_contents('php://input');
$targetUrl = $backendUrl . $requestUri;

$options = [
    'http' => [
        'method'           => $method,
        'header'           => implode("\r\n", $headers),
        'content'          => (!in_array($method, ['GET', 'HEAD'], true) && $body !== false) ? $body : '',
        'ignore_errors'    => true,
        'protocol_version' => 1.1,
        'timeout'          => 15,
    ],
];

$context = stream_context_create($options);
$response = @file_get_contents($targetUrl, false, $context);

if ($response === false) {
    http_response_code(503);
    echo json_encode(['error' => 'No se pudo conectar con Express en ' . $targetUrl]);
    exit;
}

$statusCode = 200;
if (!empty($http_response_header[0]) && preg_match('#HTTP/\d+\.\d+\s+(\d+)#', $http_response_header[0], $m)) {
    $statusCode = (int) $m[1];
}

http_response_code($statusCode);
echo $response;