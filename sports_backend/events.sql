CREATE TABLE `champion` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `temple_id` int NOT NULL,
  `year` int NOT NULL,
  `host_temple_id` int NOT NULL,
  `created_at` datetime DEFAULT (CURRENT_TIMESTAMP),
  `modified_at` datetime DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `ind_event_registration` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `user_id` int NOT NULL,
  `event_result_id` int DEFAULT null,
  `created_at` datetime DEFAULT (CURRENT_TIMESTAMP),
  `modified_at` datetime DEFAULT (CURRENT_TIMESTAMP),
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0'
);

CREATE TABLE `mst_age_category` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `from_age` int NOT NULL,
  `to_age` int NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0'
);

CREATE TABLE `mst_event` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `event_type_id` int NOT NULL,
  `age_category_id` int NOT NULL,
  `gender` ENUM ('MALE', 'FEMALE', 'ALL') NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `is_closed` tinyint(1) DEFAULT '0'
);

CREATE TABLE `mst_event_result` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `event_type_id` int NOT NULL,
  `rank` ENUM ('FIRST', 'SECOND', 'THIRD', 'NA') NOT NULL,
  `points` int NOT NULL
);

CREATE TABLE `mst_event_type` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` ENUM ('TEAM', 'INDIVIDUAL') NOT NULL,
  `participant_count` int DEFAULT '1'
);

CREATE TABLE `mst_role` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL
);

CREATE TABLE `mst_temple` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `code` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) DEFAULT null,
  `contact_name` varchar(255) DEFAULT null,
  `contact_phone` varchar(11) DEFAULT null,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT (CURRENT_TIMESTAMP),
  `modified_at` datetime DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `profile` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT null,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) DEFAULT null,
  `email` varchar(255) DEFAULT null,
  `phone` varchar(11) DEFAULT null,
  `aadhar_number` varchar(12) DEFAULT null,
  `created_at` datetime DEFAULT (CURRENT_TIMESTAMP),
  `modified_at` datetime DEFAULT (CURRENT_TIMESTAMP),
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `temple_id` int DEFAULT null,
  `dob` date NOT NULL,
  `gender` ENUM ('MALE', 'FEMALE') NOT NULL,
  `role_id` int NOT NULL DEFAULT '1'
);

CREATE TABLE `settings` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `value` int NOT NULL,
  `created_at` datetime DEFAULT (CURRENT_TIMESTAMP),
  `modified_at` datetime DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `team_event_registration` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `temple_id` int NOT NULL,
  `event_result_id` int DEFAULT null,
  `member_user_ids` varchar(500) DEFAULT null,
  `created_at` datetime DEFAULT (CURRENT_TIMESTAMP),
  `modified_at` datetime DEFAULT (CURRENT_TIMESTAMP),
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `event_id` int NOT NULL
);

CREATE TABLE `user` (
  `id` bigint PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `username` varchar(255) UNIQUE NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) UNIQUE,
  `created_at` datetime DEFAULT (CURRENT_TIMESTAMP),
  `modified_at` datetime DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE `user_role` (
  `id` int PRIMARY KEY NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `role_id` int NOT NULL
);

CREATE UNIQUE INDEX `unique_champion_temple_year` ON `champion` (`temple_id`, `year`);

CREATE INDEX `fk_team_reg_host_temple` ON `champion` (`host_temple_id`);

CREATE UNIQUE INDEX `unique_user_event` ON `ind_event_registration` (`user_id`, `event_id`);

CREATE INDEX `fk_ind_reg_event` ON `ind_event_registration` (`event_id`);

CREATE INDEX `fk_ind_reg_result` ON `ind_event_registration` (`event_result_id`);

CREATE INDEX `fk_event_age_category` ON `mst_event` (`age_category_id`);

CREATE INDEX `fk_event_type` ON `mst_event` (`event_type_id`);

CREATE UNIQUE INDEX `unique_event_rank` ON `mst_event_result` (`event_type_id`, `rank`);

CREATE UNIQUE INDEX `unique_event_rank_point` ON `mst_event_result` (`event_type_id`, `rank`, `points`);

CREATE UNIQUE INDEX `mst_event_type` ON `mst_event_type` (`name`);

CREATE UNIQUE INDEX `unique_temple_code` ON `mst_temple` (`code`);

CREATE UNIQUE INDEX `unique_aadhar` ON `profile` (`aadhar_number`);

CREATE INDEX `fk_user_temple_id` ON `profile` (`temple_id`);

CREATE INDEX `fk_profle_role_id` ON `profile` (`role_id`);

CREATE UNIQUE INDEX `unique_setting` ON `settings` (`name`);

CREATE INDEX `fk_team_reg_temple` ON `team_event_registration` (`temple_id`);

CREATE INDEX `fk_team_reg_result` ON `team_event_registration` (`event_result_id`);

CREATE INDEX `fk_team_reg_event` ON `team_event_registration` (`event_id`);

CREATE UNIQUE INDEX `unique_user_role` ON `user_role` (`user_id`, `role_id`);

CREATE INDEX `fk_user_role_id` ON `user_role` (`role_id`);

ALTER TABLE `champion` ADD CONSTRAINT `fk_champion_temple` FOREIGN KEY (`temple_id`) REFERENCES `mst_temple` (`id`) ON DELETE CASCADE;

ALTER TABLE `champion` ADD CONSTRAINT `fk_team_reg_host_temple` FOREIGN KEY (`host_temple_id`) REFERENCES `mst_temple` (`id`) ON DELETE CASCADE;

ALTER TABLE `ind_event_registration` ADD CONSTRAINT `fk_ind_reg_event` FOREIGN KEY (`event_id`) REFERENCES `mst_event` (`id`) ON DELETE CASCADE;

ALTER TABLE `ind_event_registration` ADD CONSTRAINT `fk_ind_reg_result` FOREIGN KEY (`event_result_id`) REFERENCES `mst_event_result` (`id`) ON DELETE CASCADE;

ALTER TABLE `ind_event_registration` ADD CONSTRAINT `fk_ind_reg_user` FOREIGN KEY (`user_id`) REFERENCES `profile` (`id`) ON DELETE CASCADE;

ALTER TABLE `mst_event` ADD CONSTRAINT `fk_event_age_category` FOREIGN KEY (`age_category_id`) REFERENCES `mst_age_category` (`id`) ON DELETE CASCADE;

ALTER TABLE `mst_event` ADD CONSTRAINT `fk_event_type` FOREIGN KEY (`event_type_id`) REFERENCES `mst_event_type` (`id`) ON DELETE CASCADE;

ALTER TABLE `mst_event_result` ADD CONSTRAINT `fk_point_event` FOREIGN KEY (`event_type_id`) REFERENCES `mst_event_type` (`id`) ON DELETE CASCADE;

ALTER TABLE `profile` ADD CONSTRAINT `fk_profle_role_id` FOREIGN KEY (`role_id`) REFERENCES `mst_role` (`id`) ON DELETE CASCADE;

ALTER TABLE `profile` ADD CONSTRAINT `fk_user_temple_id` FOREIGN KEY (`temple_id`) REFERENCES `mst_temple` (`id`) ON DELETE CASCADE;

ALTER TABLE `team_event_registration` ADD CONSTRAINT `fk_team_reg_event` FOREIGN KEY (`event_id`) REFERENCES `mst_event` (`id`) ON DELETE CASCADE;

ALTER TABLE `team_event_registration` ADD CONSTRAINT `fk_team_reg_result` FOREIGN KEY (`event_result_id`) REFERENCES `mst_event_result` (`id`) ON DELETE CASCADE;

ALTER TABLE `team_event_registration` ADD CONSTRAINT `fk_team_reg_temple` FOREIGN KEY (`temple_id`) REFERENCES `mst_temple` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_role` ADD CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_role` ADD CONSTRAINT `fk_user_role_id` FOREIGN KEY (`role_id`) REFERENCES `mst_role` (`id`) ON DELETE CASCADE;
