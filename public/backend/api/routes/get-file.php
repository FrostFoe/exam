<?php
$id = $_GET['id'] ?? '';
$stmt = $pdo->prepare("SELECT * FROM files WHERE id = ?");
$stmt->execute([$id]);
$file = $stmt->fetch();

if ($file) {
    echo json_encode($file);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'File not found']);
}
?>
