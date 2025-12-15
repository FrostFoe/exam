<?php
require_once '../includes/config.php';
require_once '../includes/db.php';
require_once '../includes/image_upload.php';

header('Content-Type: application/json; charset=utf-8');

// 1. Validate Token
$token = $_GET['token'] ?? '';
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Missing API Token']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM api_tokens WHERE token = ? AND is_active = 1");
$stmt->execute([$token]);
$api_user = $stmt->fetch();

if (!$api_user) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid API Token']);
    exit;
}

// 2. Route Request
$route = $_GET['route'] ?? '';

$routes = [
    'files' => 'routes/get-files.php',
    'file' => 'routes/get-file.php',
    'questions' => 'routes/get-questions.php',
    'question' => 'routes/get-question.php',
    'update-question' => 'routes/update-question.php'
];

function attachImageUrls(array $question): array
{
    $questionImage = $question['question_image'] ?? null;
    $explanationImage = $question['explanation_image'] ?? null;

    // For base64 images, we can use the data directly as the URL
    $question['question_image_url'] = $questionImage;
    $question['explanation_image_url'] = $explanationImage;
    return $question;
}

if (array_key_exists($route, $routes)) {
    include $routes[$route];
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Route not found']);
}
?>
