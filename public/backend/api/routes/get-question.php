<?php
$id = $_GET['id'] ?? '';
$stmt = $pdo->prepare("SELECT * FROM questions WHERE id = ?");
$stmt->execute([$id]);
$question = $stmt->fetch();

if ($question) {
    echo json_encode(attachImageUrls($question));
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Question not found']);
}
?>
