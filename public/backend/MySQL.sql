-- Merged MySQL database schema
-- This file contains all SQL schema, migrations, and seed data

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `mnr_question_bank`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Plain text password',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `files`
--

CREATE TABLE IF NOT EXISTS `files` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `total_questions` int(11) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

-- Migration: Add categories table and new fields to files and questions tables

-- Create categories table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#007bff',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add new columns to files table if they don't exist
ALTER TABLE `files` ADD COLUMN `display_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `original_filename`;
ALTER TABLE `files` ADD COLUMN `category_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `display_name`;
ALTER TABLE `files` ADD COLUMN `external_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL;
ALTER TABLE `files` ADD COLUMN `batch_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL;
ALTER TABLE `files` ADD COLUMN `set_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL;

-- --------------------------------------------------------

--
-- Table structure for table `api_tokens`
--

CREATE TABLE IF NOT EXISTS `api_tokens` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Plain text token',
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `api_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `questions`
--

CREATE TABLE IF NOT EXISTS `questions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `question_text` longtext COLLATE utf8mb4_unicode_ci,
  `option1` longtext COLLATE utf8mb4_unicode_ci,
  `option2` longtext COLLATE utf8mb4_unicode_ci,
  `option3` longtext COLLATE utf8mb4_unicode_ci,
  `option4` longtext COLLATE utf8mb4_unicode_ci,
  `option5` longtext COLLATE utf8mb4_unicode_ci,
  `answer` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `explanation` longtext COLLATE utf8mb4_unicode_ci,
  `question_image` longtext COLLATE utf8mb4_unicode_ci, -- Store base64 encoded image data
  `explanation_image` longtext COLLATE utf8mb4_unicode_ci, -- Store base64 encoded image data
  `type` int(11) DEFAULT '0',
  `section` int(11) DEFAULT '0',
  `order_index` int(11) DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `file_id` (`file_id`),
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`file_id`) REFERENCES `files` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migration: Change section column from int to varchar in questions table
ALTER TABLE `questions` MODIFY COLUMN `section` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT 'e.g., p, c, m, b, bm, bn, e, i, gk, iq';

-- Migration: Allow optional question/explanation images
-- (These fields are already included in the CREATE TABLE statement above)
-- ALTER TABLE `questions`
--   ADD COLUMN `question_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `explanation`,
--   ADD COLUMN `explanation_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `question_image`;

-- Add foreign key constraint to categories
ALTER TABLE `files` ADD CONSTRAINT `files_ibfk_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

-- --------------------------------------------------------

-- Seed data for initial setup

-- Insert User
SET @user_id = UUID();

INSERT INTO `users` (`id`, `email`, `password`, `name`, `created_at`)
VALUES (@user_id, 'frostfoe@gmail.com', '12345678', 'FrostFoe', NOW());

-- Insert API Token
INSERT INTO `api_tokens` (`id`, `user_id`, `token`, `name`, `created_at`, `is_active`)
VALUES (UUID(), @user_id, 'ff1337', 'Seed Token', NOW(), 1);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;