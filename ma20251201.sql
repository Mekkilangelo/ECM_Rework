-- --------------------------------------------------------
-- Hôte:                         127.0.0.1
-- Version du serveur:           8.0.44 - MySQL Community Server - GPL
-- SE du serveur:                Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Listage de la structure de table synergia. clients
CREATE TABLE IF NOT EXISTS `clients` (
  `node_id` int NOT NULL,
  `client_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_group` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  UNIQUE KEY `client_code` (`client_code`) USING BTREE,
  UNIQUE KEY `unique_client_code` (`client_code`) USING BTREE,
  KEY `fk_clients_country` (`country`),
  CONSTRAINT `fk_clients_country` FOREIGN KEY (`country`) REFERENCES `ref_country` (`name`),
  CONSTRAINT `fk_clients_node` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. closure
CREATE TABLE IF NOT EXISTS `closure` (
  `ancestor_id` int NOT NULL,
  `descendant_id` int NOT NULL,
  `depth` int DEFAULT NULL,
  PRIMARY KEY (`ancestor_id`,`descendant_id`) USING BTREE,
  KEY `descendant_id` (`descendant_id`) USING BTREE,
  KEY `idx_closure_ancestor` (`ancestor_id`),
  KEY `idx_closure_descendant` (`descendant_id`),
  KEY `idx_closure_depth` (`depth`),
  CONSTRAINT `closure_ibfk_1` FOREIGN KEY (`ancestor_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `closure_ibfk_2` FOREIGN KEY (`descendant_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. contacts
CREATE TABLE IF NOT EXISTS `contacts` (
  `contact_id` int NOT NULL AUTO_INCREMENT,
  `trial_request_node_id` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`contact_id`),
  KEY `trial_request_node_id` (`trial_request_node_id`),
  KEY `fk_trial_request_contacts` (`trial_request_node_id`),
  CONSTRAINT `contacts_ibfk_1` FOREIGN KEY (`trial_request_node_id`) REFERENCES `trial_requests` (`node_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. enums
CREATE TABLE IF NOT EXISTS `enums` (
  `id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. files
CREATE TABLE IF NOT EXISTS `files` (
  `node_id` int NOT NULL,
  `original_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `storage_key` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size` bigint DEFAULT NULL,
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `checksum` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subcategory` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `context` json DEFAULT NULL,
  `version` int DEFAULT '1',
  `is_latest` tinyint(1) DEFAULT '1',
  `previous_version_id` int DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`node_id`),
  KEY `fk_files_category` (`category`),
  KEY `fk_files_subcategory` (`subcategory`),
  KEY `idx_storage_key` (`storage_key`),
  KEY `fk_files_uploaded_by` (`uploaded_by`),
  KEY `idx_context_entity_type` ((cast(json_unquote(json_extract(`context`,_utf8mb4'$.entity_type')) as char(50) charset utf8mb4))),
  KEY `idx_context_entity_id` ((cast(json_unquote(json_extract(`context`,_utf8mb4'$.entity_id')) as unsigned))),
  KEY `idx_context_file_type` ((cast(json_unquote(json_extract(`context`,_utf8mb4'$.file_type')) as char(50) charset utf8mb4))),
  CONSTRAINT `files_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_files_category` FOREIGN KEY (`category`) REFERENCES `ref_file_category` (`name`),
  CONSTRAINT `fk_files_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. furnaces
CREATE TABLE IF NOT EXISTS `furnaces` (
  `furnace_id` int NOT NULL AUTO_INCREMENT,
  `furnace_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `furnace_size` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `heating_cell` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cooling_media` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quench_cell` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`furnace_id`),
  UNIQUE KEY `uq_furnace_config` (`furnace_type`,`furnace_size`,`heating_cell`,`cooling_media`,`quench_cell`),
  KEY `fk_furnace_size` (`furnace_size`),
  KEY `fk_heating_cell` (`heating_cell`),
  KEY `fk_cooling_media` (`cooling_media`),
  KEY `fk_quench_cell` (`quench_cell`),
  CONSTRAINT `fk_cooling_media` FOREIGN KEY (`cooling_media`) REFERENCES `ref_cooling_media` (`name`),
  CONSTRAINT `fk_furnace_size` FOREIGN KEY (`furnace_size`) REFERENCES `ref_furnace_sizes` (`name`),
  CONSTRAINT `fk_furnace_type` FOREIGN KEY (`furnace_type`) REFERENCES `ref_furnace_types` (`name`),
  CONSTRAINT `fk_heating_cell` FOREIGN KEY (`heating_cell`) REFERENCES `ref_heating_cells` (`name`),
  CONSTRAINT `fk_quench_cell` FOREIGN KEY (`quench_cell`) REFERENCES `ref_quench_cells` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. logs
CREATE TABLE IF NOT EXISTS `logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timestamp` datetime NOT NULL,
  `level` enum('error','warning','info','success','debug') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entityId` int DEFAULT NULL,
  `userId` int DEFAULT NULL,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` json DEFAULT NULL,
  `ipAddress` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sessionId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requestId` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `errorCode` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stackTrace` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_logs_timestamp` (`timestamp`) USING BTREE,
  KEY `idx_logs_level` (`level`) USING BTREE,
  KEY `idx_logs_action` (`action`) USING BTREE,
  KEY `idx_logs_user` (`userId`) USING BTREE,
  KEY `idx_logs_entity` (`entity`,`entityId`) USING BTREE,
  KEY `idx_logs_ip` (`ipAddress`) USING BTREE,
  CONSTRAINT `fk_logs_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=32201 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. nodes
CREATE TABLE IF NOT EXISTS `nodes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `path` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('client','trial_request','trial','file','part','furnace','steel') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `modified_at` datetime DEFAULT NULL,
  `data_status` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'old',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_parent_id` (`parent_id`) USING BTREE,
  KEY `idx_data_status` (`data_status`),
  KEY `idx_type` (`type`),
  CONSTRAINT `fk_nodes_data_status` FOREIGN KEY (`data_status`) REFERENCES `ref_node_data_status` (`name`),
  CONSTRAINT `nodes_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3353 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. parts
CREATE TABLE IF NOT EXISTS `parts` (
  `node_id` int NOT NULL,
  `designation` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `steel_node_id` int DEFAULT NULL,
  `client_designation` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `dim_weight_value` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dim_weight_unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dim_rect_length` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dim_rect_width` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dim_rect_height` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dim_rect_unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dim_circ_diameterIn` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dim_circ_diameterOut` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dim_circ_unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  KEY `fk_parts_designation` (`designation`),
  KEY `fk_parts_steel` (`steel_node_id`),
  KEY `fk_parts_weight_unit` (`dim_weight_unit`),
  KEY `fk_parts_rect_unit` (`dim_rect_unit`),
  KEY `fk_parts_circ_unit` (`dim_circ_unit`),
  CONSTRAINT `fk_parts_circ_unit` FOREIGN KEY (`dim_circ_unit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `fk_parts_designation` FOREIGN KEY (`designation`) REFERENCES `ref_designation` (`name`),
  CONSTRAINT `fk_parts_node` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_parts_rect_unit` FOREIGN KEY (`dim_rect_unit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `fk_parts_steel` FOREIGN KEY (`steel_node_id`) REFERENCES `steels` (`node_id`),
  CONSTRAINT `fk_parts_weight_unit` FOREIGN KEY (`dim_weight_unit`) REFERENCES `ref_units` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. recipes
CREATE TABLE IF NOT EXISTS `recipes` (
  `recipe_id` int NOT NULL AUTO_INCREMENT,
  `recipe_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`recipe_id`),
  UNIQUE KEY `recipe_number` (`recipe_number`)
) ENGINE=InnoDB AUTO_INCREMENT=1247 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. recipe_chemical_cycle
CREATE TABLE IF NOT EXISTS `recipe_chemical_cycle` (
  `chemical_cycle_id` int NOT NULL AUTO_INCREMENT,
  `recipe_id` int DEFAULT NULL,
  `wait_time_unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wait_time_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wait_pressure_unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wait_pressure_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cell_temp_unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cell_temp_value` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `selected_gas1` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `selected_gas2` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `selected_gas3` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`chemical_cycle_id`),
  UNIQUE KEY `recipe_id` (`recipe_id`),
  KEY `fk_chem_time_unit` (`wait_time_unit`),
  KEY `fk_chem_pressure_unit` (`wait_pressure_unit`),
  KEY `fk_chem_cell_temp_unit` (`cell_temp_unit`),
  CONSTRAINT `fk_chem_cell_temp_unit` FOREIGN KEY (`cell_temp_unit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `fk_chem_pressure_unit` FOREIGN KEY (`wait_pressure_unit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `fk_chem_time_unit` FOREIGN KEY (`wait_time_unit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `recipe_chemical_cycle_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1257 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. recipe_chemical_gases
CREATE TABLE IF NOT EXISTS `recipe_chemical_gases` (
  `gas_id` int NOT NULL AUTO_INCREMENT,
  `step_id` int DEFAULT NULL,
  `gas_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `debit` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gas_index` int DEFAULT NULL,
  PRIMARY KEY (`gas_id`),
  KEY `step_id` (`step_id`),
  CONSTRAINT `recipe_chemical_gases_ibfk_1` FOREIGN KEY (`step_id`) REFERENCES `recipe_chemical_steps` (`step_id`)
) ENGINE=InnoDB AUTO_INCREMENT=36067 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. recipe_chemical_steps
CREATE TABLE IF NOT EXISTS `recipe_chemical_steps` (
  `step_id` int NOT NULL AUTO_INCREMENT,
  `chemical_cycle_id` int DEFAULT NULL,
  `step_number` int DEFAULT NULL,
  `time` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `turbine` tinyint(1) DEFAULT NULL,
  `pressure` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`step_id`),
  KEY `chemical_cycle_id` (`chemical_cycle_id`),
  CONSTRAINT `recipe_chemical_steps_ibfk_1` FOREIGN KEY (`chemical_cycle_id`) REFERENCES `recipe_chemical_cycle` (`chemical_cycle_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17451 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. recipe_gas_quench
CREATE TABLE IF NOT EXISTS `recipe_gas_quench` (
  `gas_quench_id` int NOT NULL AUTO_INCREMENT,
  `recipe_id` int DEFAULT NULL,
  PRIMARY KEY (`gas_quench_id`),
  UNIQUE KEY `recipe_id` (`recipe_id`),
  CONSTRAINT `recipe_gas_quench_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. recipe_gas_quench_pressure
CREATE TABLE IF NOT EXISTS `recipe_gas_quench_pressure` (
  `pressure_step_id` int NOT NULL AUTO_INCREMENT,
  `gas_quench_id` int DEFAULT NULL,
  `step` int DEFAULT NULL,
  `duration` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pressure` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`pressure_step_id`),
  KEY `gas_quench_id` (`gas_quench_id`),
  CONSTRAINT `recipe_gas_quench_pressure_ibfk_1` FOREIGN KEY (`gas_quench_id`) REFERENCES `recipe_gas_quench` (`gas_quench_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1319 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. recipe_gas_quench_speed
CREATE TABLE IF NOT EXISTS `recipe_gas_quench_speed` (
  `speed_step_id` int NOT NULL AUTO_INCREMENT,
  `gas_quench_id` int DEFAULT NULL,
  `step` int DEFAULT NULL,
  `speed` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`speed_step_id`),
  KEY `gas_quench_id` (`gas_quench_id`),
  CONSTRAINT `recipe_gas_quench_speed_ibfk_1` FOREIGN KEY (`gas_quench_id`) REFERENCES `recipe_gas_quench` (`gas_quench_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3916 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. recipe_oil_quench
CREATE TABLE IF NOT EXISTS `recipe_oil_quench` (
  `oil_quench_id` int NOT NULL AUTO_INCREMENT,
  `recipe_id` int DEFAULT NULL,
  `pressure` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temperature_unit` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temperature_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dripping_time_unit` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dripping_time_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inerting_delay_unit` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inerting_delay_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`oil_quench_id`),
  UNIQUE KEY `recipe_id` (`recipe_id`),
  CONSTRAINT `recipe_oil_quench_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1105 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. recipe_oil_quench_speed
CREATE TABLE IF NOT EXISTS `recipe_oil_quench_speed` (
  `speed_step_id` int NOT NULL AUTO_INCREMENT,
  `oil_quench_id` int DEFAULT NULL,
  `step` int DEFAULT NULL,
  `speed` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`speed_step_id`),
  KEY `oil_quench_id` (`oil_quench_id`),
  CONSTRAINT `recipe_oil_quench_speed_ibfk_1` FOREIGN KEY (`oil_quench_id`) REFERENCES `recipe_oil_quench` (`oil_quench_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. recipe_preox_cycle
CREATE TABLE IF NOT EXISTS `recipe_preox_cycle` (
  `preox_cycle_id` int NOT NULL AUTO_INCREMENT,
  `recipe_id` int DEFAULT NULL,
  `media` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temperature_unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temperature_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`preox_cycle_id`),
  UNIQUE KEY `recipe_id` (`recipe_id`),
  KEY `fk_preox_duration_unit` (`duration_unit`),
  KEY `fk_preox_temp_unit` (`temperature_unit`),
  CONSTRAINT `fk_preox_duration_unit` FOREIGN KEY (`duration_unit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `fk_preox_temp_unit` FOREIGN KEY (`temperature_unit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `recipe_preox_cycle_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1257 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. recipe_thermal_cycle
CREATE TABLE IF NOT EXISTS `recipe_thermal_cycle` (
  `step_id` int NOT NULL AUTO_INCREMENT,
  `recipe_id` int DEFAULT NULL,
  `step_number` int DEFAULT NULL,
  `ramp` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `setpoint` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`step_id`),
  KEY `recipe_id` (`recipe_id`),
  CONSTRAINT `recipe_thermal_cycle_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2843 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_cooling_media
CREATE TABLE IF NOT EXISTS `ref_cooling_media` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_country
CREATE TABLE IF NOT EXISTS `ref_country` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_designation
CREATE TABLE IF NOT EXISTS `ref_designation` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_file_category
CREATE TABLE IF NOT EXISTS `ref_file_category` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_file_subcategory
CREATE TABLE IF NOT EXISTS `ref_file_subcategory` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_furnace_sizes
CREATE TABLE IF NOT EXISTS `ref_furnace_sizes` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_furnace_types
CREATE TABLE IF NOT EXISTS `ref_furnace_types` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_heating_cells
CREATE TABLE IF NOT EXISTS `ref_heating_cells` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_location
CREATE TABLE IF NOT EXISTS `ref_location` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_mounting_type
CREATE TABLE IF NOT EXISTS `ref_mounting_type` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_node_data_status
CREATE TABLE IF NOT EXISTS `ref_node_data_status` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_position_type
CREATE TABLE IF NOT EXISTS `ref_position_type` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_process_type
CREATE TABLE IF NOT EXISTS `ref_process_type` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_quench_cells
CREATE TABLE IF NOT EXISTS `ref_quench_cells` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_roles
CREATE TABLE IF NOT EXISTS `ref_roles` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_status
CREATE TABLE IF NOT EXISTS `ref_status` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_steel_elements
CREATE TABLE IF NOT EXISTS `ref_steel_elements` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_steel_family
CREATE TABLE IF NOT EXISTS `ref_steel_family` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_steel_standard
CREATE TABLE IF NOT EXISTS `ref_steel_standard` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_units
CREATE TABLE IF NOT EXISTS `ref_units` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`name`),
  KEY `unit_type` (`unit_type`),
  CONSTRAINT `ref_units_ibfk_1` FOREIGN KEY (`unit_type`) REFERENCES `ref_unit_types` (`type_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_unit_types
CREATE TABLE IF NOT EXISTS `ref_unit_types` (
  `type_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`type_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. results_curve_points
CREATE TABLE IF NOT EXISTS `results_curve_points` (
  `point_id` int NOT NULL AUTO_INCREMENT,
  `series_id` int NOT NULL,
  `distance` double DEFAULT NULL,
  `value` double DEFAULT NULL,
  PRIMARY KEY (`point_id`),
  KEY `series_id` (`series_id`),
  CONSTRAINT `results_curve_points_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `results_curve_series` (`series_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65712 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. results_curve_series
CREATE TABLE IF NOT EXISTS `results_curve_series` (
  `series_id` int NOT NULL AUTO_INCREMENT,
  `sample_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`series_id`),
  KEY `sample_id` (`sample_id`),
  CONSTRAINT `results_curve_series_ibfk_1` FOREIGN KEY (`sample_id`) REFERENCES `results_samples` (`sample_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. results_ecd_positions
CREATE TABLE IF NOT EXISTS `results_ecd_positions` (
  `ecd_position_id` int NOT NULL AUTO_INCREMENT,
  `sample_id` int NOT NULL,
  `distance` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ecd_position_id`),
  KEY `sample_id` (`sample_id`),
  CONSTRAINT `results_ecd_positions_ibfk_1` FOREIGN KEY (`sample_id`) REFERENCES `results_samples` (`sample_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=520 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. results_hardness_points
CREATE TABLE IF NOT EXISTS `results_hardness_points` (
  `hardness_point_id` int NOT NULL AUTO_INCREMENT,
  `sample_id` int NOT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`hardness_point_id`),
  KEY `sample_id` (`sample_id`),
  CONSTRAINT `results_hardness_points_ibfk_1` FOREIGN KEY (`sample_id`) REFERENCES `results_samples` (`sample_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2058 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. results_samples
CREATE TABLE IF NOT EXISTS `results_samples` (
  `sample_id` int NOT NULL AUTO_INCREMENT,
  `result_step_id` int NOT NULL,
  `sample_number` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ecd_hardness_unit` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ecd_hardness_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`sample_id`),
  KEY `result_step_id` (`result_step_id`),
  CONSTRAINT `results_samples_ibfk_1` FOREIGN KEY (`result_step_id`) REFERENCES `results_steps` (`result_step_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2056 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. results_steps
CREATE TABLE IF NOT EXISTS `results_steps` (
  `result_step_id` int NOT NULL AUTO_INCREMENT,
  `trial_node_id` int NOT NULL,
  `step_number` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`result_step_id`),
  KEY `trial_node_id` (`trial_node_id`),
  CONSTRAINT `results_steps_ibfk_1` FOREIGN KEY (`trial_node_id`) REFERENCES `trials` (`node_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2054 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. specs_ecd
CREATE TABLE IF NOT EXISTS `specs_ecd` (
  `spec_id` int NOT NULL AUTO_INCREMENT,
  `part_node_id` int NOT NULL,
  `name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `depthMin` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `depthMax` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `depthUnit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hardness` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hardnessUnit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`spec_id`),
  KEY `part_node_id` (`part_node_id`),
  KEY `fk_spec_ecd_depth_unit` (`depthUnit`),
  KEY `fk_spec_ecd_hard_unit` (`hardnessUnit`),
  KEY `idx_specs_ecd_part` (`part_node_id`),
  CONSTRAINT `fk_spec_ecd_depth_unit` FOREIGN KEY (`depthUnit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `fk_spec_ecd_hard_unit` FOREIGN KEY (`hardnessUnit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `specs_ecd_ibfk_1` FOREIGN KEY (`part_node_id`) REFERENCES `parts` (`node_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1032 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. specs_hardness
CREATE TABLE IF NOT EXISTS `specs_hardness` (
  `spec_id` int NOT NULL AUTO_INCREMENT,
  `part_node_id` int NOT NULL,
  `name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `min` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`spec_id`),
  KEY `part_node_id` (`part_node_id`),
  KEY `fk_spec_hard_unit` (`unit`),
  KEY `idx_specs_hardness_part` (`part_node_id`),
  CONSTRAINT `fk_spec_hard_unit` FOREIGN KEY (`unit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `specs_hardness_ibfk_1` FOREIGN KEY (`part_node_id`) REFERENCES `parts` (`node_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1036 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. steels
CREATE TABLE IF NOT EXISTS `steels` (
  `node_id` int NOT NULL,
  `grade` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `family` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `standard` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `elements` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chemistery` json DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  KEY `grade` (`grade`),
  KEY `fk_steels_family` (`family`),
  KEY `fk_steels_standard` (`standard`),
  KEY `fk_steels_elements` (`elements`),
  KEY `idx_steel_grade` (`grade`),
  CONSTRAINT `fk_steels_elements` FOREIGN KEY (`elements`) REFERENCES `ref_steel_elements` (`name`),
  CONSTRAINT `fk_steels_family` FOREIGN KEY (`family`) REFERENCES `ref_steel_family` (`name`),
  CONSTRAINT `fk_steels_node` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_steels_standard` FOREIGN KEY (`standard`) REFERENCES `ref_steel_standard` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. steel_equivalents
CREATE TABLE IF NOT EXISTS `steel_equivalents` (
  `steel_node_id` int NOT NULL,
  `equivalent_steel_node_id` int NOT NULL,
  PRIMARY KEY (`steel_node_id`,`equivalent_steel_node_id`),
  KEY `fk_steel_equivalent` (`equivalent_steel_node_id`),
  CONSTRAINT `fk_steel_equivalent` FOREIGN KEY (`equivalent_steel_node_id`) REFERENCES `steels` (`node_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_steel_original` FOREIGN KEY (`steel_node_id`) REFERENCES `steels` (`node_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. tests
CREATE TABLE IF NOT EXISTS `tests` (
  `node_id` int NOT NULL,
  `test_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `load_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `test_date` date DEFAULT NULL,
  `status` enum('OK','NOK','Pending') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` enum('ECM','Client site') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `furnace_data` json DEFAULT NULL,
  `load_data` json DEFAULT NULL,
  `recipe_data` json DEFAULT NULL,
  `quench_data` json DEFAULT NULL,
  `results_data` json DEFAULT NULL,
  `mounting_type` enum('Support_Rack','Hanging','Fixture','Tray','Conveyor_Belt') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position_type` enum('Horizontal','Vertical','Rotary','Stationary','Oscillating') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `process_type` enum('Annealing','Quenching','Tempering','Carburizing','Nitriding') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preox_media` enum('Water','Air','N2') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  CONSTRAINT `tests_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. trials
CREATE TABLE IF NOT EXISTS `trials` (
  `node_id` int NOT NULL,
  `recipe_id` int DEFAULT NULL,
  `furnace_id` int DEFAULT NULL,
  `trial_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `load_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trial_date` date DEFAULT NULL,
  `status` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `load_weight_unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `load_weight_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `load_size_width_unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `load_size_width_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `load_size_height_unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `load_size_height_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `load_size_length_unit` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `load_size_length_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `load_part_count` int DEFAULT NULL,
  `load_floor_count` int DEFAULT NULL,
  `load_comments` text COLLATE utf8mb4_unicode_ci,
  `mounting_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `process_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  KEY `recipe_id` (`recipe_id`),
  KEY `furnace_id` (`furnace_id`),
  KEY `fk_trials_status` (`status`),
  KEY `fk_trials_location` (`location`),
  KEY `fk_trials_mounting_type` (`mounting_type`),
  KEY `fk_trials_position_type` (`position_type`),
  KEY `fk_trials_process_type` (`process_type`),
  KEY `fk_trials_weight_unit` (`load_weight_unit`),
  KEY `fk_trials_width_unit` (`load_size_width_unit`),
  KEY `fk_trials_height_unit` (`load_size_height_unit`),
  KEY `fk_trials_length_unit` (`load_size_length_unit`),
  KEY `idx_trials_recipe` (`recipe_id`),
  KEY `idx_trials_furnace` (`furnace_id`),
  CONSTRAINT `fk_trials_height_unit` FOREIGN KEY (`load_size_height_unit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `fk_trials_length_unit` FOREIGN KEY (`load_size_length_unit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `fk_trials_location` FOREIGN KEY (`location`) REFERENCES `ref_location` (`name`),
  CONSTRAINT `fk_trials_mounting_type` FOREIGN KEY (`mounting_type`) REFERENCES `ref_mounting_type` (`name`),
  CONSTRAINT `fk_trials_node` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_trials_position_type` FOREIGN KEY (`position_type`) REFERENCES `ref_position_type` (`name`),
  CONSTRAINT `fk_trials_process_type` FOREIGN KEY (`process_type`) REFERENCES `ref_process_type` (`name`),
  CONSTRAINT `fk_trials_status` FOREIGN KEY (`status`) REFERENCES `ref_status` (`name`),
  CONSTRAINT `fk_trials_weight_unit` FOREIGN KEY (`load_weight_unit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `fk_trials_width_unit` FOREIGN KEY (`load_size_width_unit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `trials_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`),
  CONSTRAINT `trials_ibfk_2` FOREIGN KEY (`furnace_id`) REFERENCES `furnaces` (`furnace_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. trial_requests
CREATE TABLE IF NOT EXISTS `trial_requests` (
  `node_id` int NOT NULL,
  `request_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `request_date` date DEFAULT NULL,
  `commercial` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  UNIQUE KEY `request_number` (`request_number`) USING BTREE,
  UNIQUE KEY `unique_request_number` (`request_number`),
  KEY `idx_request_number` (`request_number`),
  KEY `idx_request_date` (`request_date`),
  CONSTRAINT `fk_trial_requests_node` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. units
CREATE TABLE IF NOT EXISTS `units` (
  `id` int NOT NULL AUTO_INCREMENT,
  `length_units` enum('mm','inch') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weight_units` enum('g','pound') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hardness_units` enum('HC_20','HC_30','HC_45','HC_60','HV_200','HV_300','HV_500') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temperature_units` enum('°C','°F') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `time_units` enum('s','min','h') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pressure_units` enum('mbar','N') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `unique_username` (`username`) USING BTREE,
  KEY `fk_users_role` (`role`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role`) REFERENCES `ref_roles` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
