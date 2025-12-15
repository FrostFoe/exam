<?php

function convertImageToBase64(array $file): ?string
{
    if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
        return null;
    }

    if ($file['size'] > MAX_IMAGE_UPLOAD_BYTES) {
        throw new RuntimeException('Image must be 100 KB or smaller.');
    }

    $imageInfo = getimagesize($file['tmp_name']);
    if (!$imageInfo || !in_array($imageInfo['mime'], ALLOWED_IMAGE_MIME_TYPES, true)) {
        throw new RuntimeException('Only JPEG and PNG images are supported.');
    }

    $imageData = file_get_contents($file['tmp_name']);
    if ($imageData === false) {
        throw new RuntimeException('Unable to read the uploaded image.');
    }

    $base64 = base64_encode($imageData);
    $dataUrl = 'data:' . $imageInfo['mime'] . ';base64,' . $base64;

    return $dataUrl;
}

function uploadImageFromInput(string $fieldName): ?string
{
    if (!isset($_FILES[$fieldName])) {
        return null;
    }

    $file = $_FILES[$fieldName];
    if ($file['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Image upload failed (error code ' . $file['error'] . ').');
    }

    return convertImageToBase64($file);
}

function getUploadedImageUrl(?string $base64Data): ?string
{
    // If it's already a data URL, return it as is
    if ($base64Data && strpos($base64Data, 'data:') === 0) {
        return $base64Data;
    }

    return null;
}

function buildFullUrl(string $path): string
{
    $host = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? 'localhost');
    $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    $port = $_SERVER['SERVER_PORT'] ?? null;
    $scheme = $https || $port === '443' ? 'https' : 'http';
    return $scheme . '://' . $host . '/' . ltrim($path, '/');
}

function validateAndSanitizeBase64Image(?string $base64Data): ?string
{
    if (!$base64Data) {
        return null;
    }

    // If it's a data URL, extract the base64 part
    if (strpos($base64Data, 'data:image/') === 0) {
        $dataParts = explode(';', $base64Data, 2);
        $mimeType = str_replace('data:', '', $dataParts[0]);

        if (!in_array($mimeType, ALLOWED_IMAGE_MIME_TYPES, true)) {
            throw new RuntimeException('Invalid image type. Only JPEG and PNG are supported.');
        }

        $base64String = str_replace('base64,', '', $dataParts[1]);
    } else {
        // Raw base64 string, assume JPEG
        $base64String = $base64Data;
        $mimeType = 'image/jpeg';
    }

    // Validate base64 format
    $decoded = base64_decode($base64String, true);
    if ($decoded === false) {
        throw new RuntimeException('Invalid base64 format.');
    }

    // Check size
    $imageData = base64_decode($base64String);
    if (strlen($imageData) > MAX_IMAGE_UPLOAD_BYTES) {
        throw new RuntimeException('Image must be 100 KB or smaller.');
    }

    // Validate that it's actually an image
    $imageInfo = getimagesizefromstring($imageData);
    if (!$imageInfo) {
        throw new RuntimeException('Invalid image data.');
    }

    if (!in_array($imageInfo['mime'], ALLOWED_IMAGE_MIME_TYPES, true)) {
        throw new RuntimeException('Only JPEG and PNG images are supported.');
    }

    // Return as data URL
    return 'data:' . $imageInfo['mime'] . ';base64,' . $base64String;
}
