<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$backendUrl = 'http://127.0.0.1:3000';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH) ?: '/';

if ($path === '/gateway/health') {
    http_response_code(200);
    echo json_encode(['status' => 'OK', 'gateway' => 'PHP API Gateway activo']);
    exit;
}

// Reenviar cabeceras clave (Authorization y Content-Type)
$headers = [
    'Accept: application/json',
    'Connection: close',
];

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