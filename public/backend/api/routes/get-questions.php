<?php
$file_id = $_GET['file_id'] ?? '';

if ($file_id) {
    $stmt = $pdo->prepare("SELECT * FROM questions WHERE file_id = ? ORDER BY order_index ASC");
    $stmt->execute([$file_id]);
} else {
    // Fallback: Fetch all questions if no file_id provided (Legacy behavior support)
    $stmt = $pdo->query("SELECT * FROM questions ORDER BY created_at DESC");
}

$questions = $stmt->fetchAll();
$questions = array_map('attachImageUrls', $questions);

echo json_encode($questions);
?>
