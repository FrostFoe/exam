<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'zxtfmwrs_mnr_course');
define('DB_USER', 'zxtfmwrs_zxtfmwrs');
define('DB_PASS', 'ws;0V;5YG2p0Az');
define('DB_CHARSET', 'utf8mb4');

// App Configuration
define('APP_NAME', 'Universal Question Bank API');
define('BASE_URL', '/php'); // Adjust based on where it's hosted

define('APP_PUBLIC_URL', '/php'); // The public URL path that corresponds to this folder
define('UPLOADS_DIR', __DIR__ . '/../uploads');
define('IMAGE_UPLOAD_SUBDIR', 'images');
define('IMAGE_UPLOAD_DIR', UPLOADS_DIR . '/' . IMAGE_UPLOAD_SUBDIR);
define('UPLOADS_URL_PATH', rtrim(APP_PUBLIC_URL, '/') . '/uploads');
define('IMAGE_UPLOAD_URL', rtrim(UPLOADS_URL_PATH, '/') . '/' . IMAGE_UPLOAD_SUBDIR);
define('MAX_IMAGE_UPLOAD_BYTES', 100 * 1024);
define('ALLOWED_IMAGE_MIME_TYPES', [
	'image/jpeg',
	'image/png'
]);

// Error Reporting (Disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);
?>
