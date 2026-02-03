<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$YOCO_SECRET_KEY = getenv('YOCO_SECRET_KEY') ?: '';

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['amount'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request: Amount is required']);
    exit();
}

$payload = [
    'amount' => $data['amount'],
    'currency' => $data['currency'] ?? 'ZAR',
    'metadata' => $data['metadata'] ?? [],
    'successUrl' => $data['successUrl'],
    'cancelUrl' => $data['cancelUrl'],
    'failureUrl' => $data['failureUrl']
];

$ch = curl_init('https://payments.yoco.com/api/checkouts');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $YOCO_SECRET_KEY
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'Curl error: ' . curl_error($ch)]);
} else {
    http_response_code($httpCode);
    echo $response;
}

curl_close($ch);
?>
