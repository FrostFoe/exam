<?php
require_once '../includes/config.php';
require_once '../includes/db.php';
require_once '../includes/image_upload.php';

header('Content-Type: application/json');

// Validate Token
$token = $_GET['token'] ?? $_POST['token'] ?? $_REQUEST['token'] ?? '';
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    $base64_image_data = null;

    // Get input data (JSON or Form)
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }

    // Try to handle base64 image data parameter
    $base64Image = $input['image_base64'] ?? $_REQUEST['image_base64'] ?? null;
    if ($base64Image) {
        $base64_image_data = validateAndSanitizeBase64Image($base64Image);
    }
    // Fallback to traditional file upload
    elseif (isset($_FILES['image'])) {
        $base64_image_data = uploadImageFromInput('image');
    }

    if (!$base64_image_data) {
        throw new RuntimeException('No image data provided. Provide either "image" file or "image_base64" parameter.');
    }

    echo json_encode([
        'success' => true,
        'base64_data' => $base64_image_data,
        'url' => $base64_image_data,  // Data URL can be used directly in HTML
        'message' => 'Image uploaded successfully as base64'
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
