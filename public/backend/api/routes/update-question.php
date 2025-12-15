<?php
// NOTE: Functions from includes/image_upload.php are already available
// as they are included in the main api/index.php file

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// Get input data (JSON or Form)
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    $input = $_POST;
}

$id = $input['id'] ?? '';
if (empty($id)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing Question ID']);
    exit;
}

// Fields to update - including image fields which will store base64 data
$allowed_fields = ['question_text', 'option1', 'option2', 'option3', 'option4', 'option5', 'answer', 'explanation', 'type', 'section', 'question_image', 'explanation_image'];
$updates = [];
$params = [];

foreach ($allowed_fields as $field) {
    if (isset($input[$field])) {
        // Validate and sanitize image fields
        if ($field === 'question_image' || $field === 'explanation_image') {
            $imageData = $input[$field];
            if (!empty($imageData)) {
                $imageData = validateAndSanitizeBase64Image($imageData);
            }
            $updates[] = "$field = ?";
            $params[] = $imageData;
        } else {
            $updates[] = "$field = ?";
            $params[] = $input[$field];
        }
    }
}

if (empty($updates)) {
    http_response_code(400);
    echo json_encode(['error' => 'No fields to update']);
    exit;
}

$params[] = $id;
$sql = "UPDATE questions SET " . implode(', ', $updates) . " WHERE id = ?";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => 'Question updated']);
    } else {
        // Could be that data didn't change, or ID not found
        echo json_encode(['success' => true, 'message' => 'No changes made or ID not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
