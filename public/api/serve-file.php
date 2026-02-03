<?php
header('Access-Control-Allow-Origin: *');

// 1. Config
$SUPABASE_URL = 'https://jdxxtnjvyaujrxueuoge.databasepad.com';
$SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFhMDUzODJlLWE1NGMtNDY4ZC05YjRlLTgzMTNmNTVkNGRiMyJ9.eyJwcm9qZWN0SWQiOiJqZHh4dG5qdnlhdWpyeHVldW9nZSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY1NDE3OTM0LCJleHAiOjIwODA3Nzc5MzQsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.vaJs6wpz0dfoobRzVCRG82q1psyeRdoVXtEqW3mZwA0';

if (!isset($_GET['id'])) {
    http_response_code(400);
    die('File ID required');
}

$fileId = $_GET['id'];

// 2. Fetch File from DB
$url = "$SUPABASE_URL/rest/v1/geloofsonderrig_files?id=eq.$fileId&select=file_name,mime_type,file_data";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "apikey: $SUPABASE_KEY",
    "Authorization: Bearer $SUPABASE_KEY"
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(404);
    die('File not found');
}

$data = json_decode($response, true);

if (empty($data)) {
    http_response_code(404);
    die('File not found');
}

$file = $data[0];

// 3. Serve File
$fileData = base64_decode($file['file_data']);
header('Content-Description: File Transfer');
header('Content-Type: ' . $file['mime_type']);
header('Content-Disposition: inline; filename="' . $file['file_name'] . '"');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Content-Length: ' . strlen($fileData));

echo $fileData;
exit;
?>
