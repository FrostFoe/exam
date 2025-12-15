<?php
$stmt = $pdo->query("SELECT id, original_filename, uploaded_at, total_questions FROM files ORDER BY uploaded_at DESC");
$files = $stmt->fetchAll();
echo json_encode($files);
?>
