-- Quiz completion tracking (run once on technieum_ctf).
-- Same DDL is also included in seed_course_rasp.sql — use this file if you only need quiz_attempts.
USE `technieum_ctf`;

CREATE TABLE IF NOT EXISTS `quiz_attempts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `quiz_type` enum('product_mcq','course_topic_quiz') NOT NULL,
  `subject_slug` varchar(191) NOT NULL,
  `score_correct` smallint unsigned NOT NULL,
  `score_total` smallint unsigned NOT NULL,
  `completed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_quiz_attempts_user` (`user_id`),
  KEY `idx_quiz_attempts_type_time` (`quiz_type`, `completed_at`),
  CONSTRAINT `fk_quiz_attempts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
