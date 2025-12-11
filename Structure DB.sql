-- --------------------------------------------------------
-- Hôte:                         127.0.0.1
-- Version du serveur:           8.0.32 - MySQL Community Server - GPL
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
  `node_id` int NOT NULL COMMENT '? RELATION FONDAMENTALE : Référence au nœud parent',
  `client_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Code unique du client',
  `city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ville du client',
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Pays - FK vers ref_country.name (normalisé)',
  `client_group` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Groupe du client',
  `address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Adresse du client',
  PRIMARY KEY (`node_id`),
  UNIQUE KEY `client_code` (`client_code`),
  UNIQUE KEY `unique_client_code` (`client_code`),
  KEY `fk_clients_country` (`country`),
  CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `clients_ibfk_2` FOREIGN KEY (`country`) REFERENCES `ref_country` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. closure
CREATE TABLE IF NOT EXISTS `closure` (
  `ancestor_id` int NOT NULL COMMENT 'ID du nœud ancêtre',
  `descendant_id` int NOT NULL COMMENT 'ID du nœud descendant',
  `depth` int NOT NULL DEFAULT '0' COMMENT 'Profondeur de la relation (0 = nœud lui-même, 1 = enfant direct, etc.)',
  PRIMARY KEY (`ancestor_id`,`descendant_id`),
  KEY `idx_closure_ancestor` (`ancestor_id`),
  KEY `idx_closure_descendant` (`descendant_id`),
  KEY `idx_closure_depth` (`depth`),
  CONSTRAINT `closure_ibfk_1` FOREIGN KEY (`ancestor_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `closure_ibfk_2` FOREIGN KEY (`descendant_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. contacts
CREATE TABLE IF NOT EXISTS `contacts` (
  `contact_id` int NOT NULL AUTO_INCREMENT COMMENT 'Identifiant unique du contact',
  `trial_request_node_id` int NOT NULL COMMENT '? RELATION : Référence au trial_request (via node_id)',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nom du contact',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email du contact',
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Téléphone du contact',
  PRIMARY KEY (`contact_id`),
  KEY `fk_trial_request_contacts` (`trial_request_node_id`),
  CONSTRAINT `contacts_ibfk_1` FOREIGN KEY (`trial_request_node_id`) REFERENCES `trial_requests` (`node_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. files
CREATE TABLE IF NOT EXISTS `files` (
  `node_id` int NOT NULL COMMENT '? RELATION FONDAMENTALE : Référence au nœud parent',
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom original du fichier',
  `file_path` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Chemin de stockage du fichier',
  `storage_key` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `size` bigint DEFAULT NULL COMMENT 'Taille du fichier en octets',
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Type MIME du fichier',
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Empreinte du fichier (checksum)',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Catégorie générale du fichier (micrographs, control-location, photos, etc.) - FK vers ref_file_category.name',
  `subcategory` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Sous-catégorie spécifique/dynamique (ex: result-0-sample-1, x100, etc.) - Pas de FK pour flexibilité',
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
  KEY `files_category` (`category`),
  KEY `files_subcategory` (`subcategory`),
  KEY `files_storage_key` (`storage_key`),
  KEY `files_uploaded_by` (`uploaded_by`),
  KEY `idx_context_entity_type` ((cast(json_unquote(json_extract(`context`,_utf8mb4'$.entity_type')) as char(50) charset utf8mb4))),
  KEY `idx_context_entity_id` ((cast(json_unquote(json_extract(`context`,_utf8mb4'$.entity_id')) as unsigned))),
  KEY `idx_context_file_type` ((cast(json_unquote(json_extract(`context`,_utf8mb4'$.file_type')) as char(50) charset utf8mb4))),
  CONSTRAINT `files_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `files_ibfk_2` FOREIGN KEY (`category`) REFERENCES `ref_file_category` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_files_uploaded_by` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. file_metadata
CREATE TABLE IF NOT EXISTS `file_metadata` (
  `id` int NOT NULL AUTO_INCREMENT,
  `file_node_id` int NOT NULL,
  `meta_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meta_value` text COLLATE utf8mb4_unicode_ci,
  `meta_type` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci DEFAULT 'string',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_file_meta` (`file_node_id`,`meta_key`),
  KEY `idx_meta_key` (`meta_key`),
  KEY `idx_meta_type` (`meta_type`),
  CONSTRAINT `fk_file_metadata_node` FOREIGN KEY (`file_node_id`) REFERENCES `files` (`node_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Métadonnées extensibles pour les fichiers';

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. furnaces
CREATE TABLE IF NOT EXISTS `furnaces` (
  `furnace_id` int NOT NULL AUTO_INCREMENT COMMENT 'ID unique du four (auto-increment) - PLUS lié aux nodes!',
  `furnace_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Type de four - FK vers ref_furnace_types.name',
  `furnace_size` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Taille du four - FK vers ref_furnace_sizes.name',
  `heating_cell` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Cellule de chauffage - FK vers ref_heating_cells.name',
  `cooling_media` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Média de refroidissement - FK vers ref_cooling_media.name',
  `quench_cell` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Cellule de trempe - FK vers ref_quench_cells.name',
  PRIMARY KEY (`furnace_id`),
  UNIQUE KEY `uq_furnace_config` (`furnace_type`,`furnace_size`,`heating_cell`,`cooling_media`,`quench_cell`),
  KEY `fk_furnace_size` (`furnace_size`),
  KEY `fk_heating_cell` (`heating_cell`),
  KEY `fk_cooling_media` (`cooling_media`),
  KEY `fk_quench_cell` (`quench_cell`),
  CONSTRAINT `furnaces_ibfk_1` FOREIGN KEY (`furnace_type`) REFERENCES `ref_furnace_types` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `furnaces_ibfk_2` FOREIGN KEY (`furnace_size`) REFERENCES `ref_furnace_sizes` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `furnaces_ibfk_3` FOREIGN KEY (`heating_cell`) REFERENCES `ref_heating_cells` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `furnaces_ibfk_4` FOREIGN KEY (`cooling_media`) REFERENCES `ref_cooling_media` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `furnaces_ibfk_5` FOREIGN KEY (`quench_cell`) REFERENCES `ref_quench_cells` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. logs
CREATE TABLE IF NOT EXISTS `logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timestamp` datetime NOT NULL,
  `level` enum('error','warning','info','success','debug') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Type d''action (login, logout, create, update, delete, etc.)',
  `entity` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entité concernée (user, client, order, part, etc.)',
  `entityId` int DEFAULT NULL COMMENT 'ID de l''entité concernée',
  `userId` int DEFAULT NULL COMMENT 'ID de l''utilisateur qui a effectué l''action',
  `username` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nom de l''utilisateur (pour éviter les jointures)',
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Message descriptif de l''action',
  `details` json DEFAULT NULL COMMENT 'Détails additionnels en JSON (données modifiées, erreurs, etc.)',
  `ipAddress` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Adresse IP de l''utilisateur (IPv4 ou IPv6)',
  `userAgent` text COLLATE utf8mb4_unicode_ci COMMENT 'User-Agent du navigateur',
  `sessionId` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID de session pour tracer les actions liées',
  `requestId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID unique de la requête pour le debugging',
  `duration` int DEFAULT NULL COMMENT 'Durée de l''opération en millisecondes',
  `errorCode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Code d''erreur spécifique',
  `stackTrace` text COLLATE utf8mb4_unicode_ci COMMENT 'Stack trace en cas d''erreur',
  PRIMARY KEY (`id`),
  KEY `idx_logs_timestamp` (`timestamp`),
  KEY `idx_logs_level` (`level`),
  KEY `idx_logs_action` (`action`),
  KEY `idx_logs_user` (`userId`,`username`),
  KEY `idx_logs_entity` (`entity`,`entityId`),
  KEY `idx_logs_ip` (`ipAddress`)
) ENGINE=InnoDB AUTO_INCREMENT=22488 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. nodes
CREATE TABLE IF NOT EXISTS `nodes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom du nœud',
  `path` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Chemin complet dans la hiérarchie',
  `type` enum('client','trial_request','trial','file','part','furnace','steel') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Type de nœud (détermine la table de données associée)',
  `parent_id` int DEFAULT NULL COMMENT 'Référence au nœud parent (relation directe)',
  `created_at` datetime DEFAULT NULL COMMENT 'Date de création du nœud',
  `modified_at` datetime DEFAULT NULL COMMENT 'Date de dernière modification',
  `data_status` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'old' COMMENT 'Statut des données (NEW, OLD, OPENED) - FK vers ref_node_data_status.name',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Description optionnelle du nœud',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_data_status` (`data_status`),
  KEY `idx_type` (`type`),
  CONSTRAINT `nodes_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_2` FOREIGN KEY (`data_status`) REFERENCES `ref_node_data_status` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3379 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. parts
CREATE TABLE IF NOT EXISTS `parts` (
  `node_id` int NOT NULL COMMENT '? RELATION FONDAMENTALE : Référence au nœud parent',
  `designation` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Type de pièce - FK vers ref_designation.name',
  `steel_node_id` int DEFAULT NULL COMMENT 'Référence vers l''acier utilisé - FK vers steels.node_id',
  `client_designation` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Désignation client de la pièce',
  `reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Référence de la pièce',
  `quantity` int DEFAULT NULL COMMENT 'Quantité de pièces',
  `dim_weight_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valeur du poids',
  `dim_weight_unit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unité de poids - FK vers ref_units.name',
  `dim_rect_length` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Longueur (rectangulaire)',
  `dim_rect_width` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Largeur (rectangulaire)',
  `dim_rect_height` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hauteur (rectangulaire)',
  `dim_rect_unit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unité dimensions rectangulaires - FK vers ref_units.name',
  `dim_circ_diameterIn` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Diamètre intérieur (circulaire)',
  `dim_circ_diameterOut` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Diamètre extérieur (circulaire)',
  `dim_circ_unit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unité dimensions circulaires - FK vers ref_units.name',
  PRIMARY KEY (`node_id`),
  KEY `fk_parts_designation` (`designation`),
  KEY `fk_parts_steel` (`steel_node_id`),
  KEY `fk_parts_weight_unit` (`dim_weight_unit`),
  KEY `fk_parts_rect_unit` (`dim_rect_unit`),
  KEY `fk_parts_circ_unit` (`dim_circ_unit`),
  CONSTRAINT `parts_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `parts_ibfk_2` FOREIGN KEY (`designation`) REFERENCES `ref_designation` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `parts_ibfk_3` FOREIGN KEY (`steel_node_id`) REFERENCES `steels` (`node_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `parts_ibfk_4` FOREIGN KEY (`dim_weight_unit`) REFERENCES `ref_units` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `parts_ibfk_5` FOREIGN KEY (`dim_rect_unit`) REFERENCES `ref_units` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `parts_ibfk_6` FOREIGN KEY (`dim_circ_unit`) REFERENCES `ref_units` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. recipes
CREATE TABLE IF NOT EXISTS `recipes` (
  `recipe_id` int NOT NULL AUTO_INCREMENT,
  `recipe_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`recipe_id`),
  UNIQUE KEY `recipe_number` (`recipe_number`)
) ENGINE=InnoDB AUTO_INCREMENT=1246 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. recipe_chemical_cycle
CREATE TABLE IF NOT EXISTS `recipe_chemical_cycle` (
  `chemical_cycle_id` int NOT NULL AUTO_INCREMENT,
  `recipe_id` int DEFAULT NULL,
  `wait_time_unit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wait_time_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wait_pressure_unit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wait_pressure_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cell_temp_unit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cell_temp_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `selected_gas1` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `selected_gas2` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `selected_gas3` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`chemical_cycle_id`),
  UNIQUE KEY `recipe_id` (`recipe_id`),
  KEY `wait_time_unit` (`wait_time_unit`),
  KEY `wait_pressure_unit` (`wait_pressure_unit`),
  KEY `fk_recipe_chemical_cycle_cell_temp_unit` (`cell_temp_unit`),
  CONSTRAINT `fk_recipe_chemical_cycle_cell_temp_unit` FOREIGN KEY (`cell_temp_unit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `recipe_chemical_cycle_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `recipe_chemical_cycle_ibfk_2` FOREIGN KEY (`wait_time_unit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `recipe_chemical_cycle_ibfk_3` FOREIGN KEY (`wait_pressure_unit`) REFERENCES `ref_units` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1099 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  CONSTRAINT `recipe_chemical_gases_ibfk_1` FOREIGN KEY (`step_id`) REFERENCES `recipe_chemical_steps` (`step_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35933 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  CONSTRAINT `recipe_chemical_steps_ibfk_1` FOREIGN KEY (`chemical_cycle_id`) REFERENCES `recipe_chemical_cycle` (`chemical_cycle_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17407 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. recipe_gas_quench
CREATE TABLE IF NOT EXISTS `recipe_gas_quench` (
  `gas_quench_id` int NOT NULL AUTO_INCREMENT,
  `recipe_id` int DEFAULT NULL,
  PRIMARY KEY (`gas_quench_id`),
  UNIQUE KEY `recipe_id` (`recipe_id`),
  CONSTRAINT `recipe_gas_quench_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1099 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  CONSTRAINT `recipe_gas_quench_pressure_ibfk_1` FOREIGN KEY (`gas_quench_id`) REFERENCES `recipe_gas_quench` (`gas_quench_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1295 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  CONSTRAINT `recipe_gas_quench_speed_ibfk_1` FOREIGN KEY (`gas_quench_id`) REFERENCES `recipe_gas_quench` (`gas_quench_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3856 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  CONSTRAINT `recipe_oil_quench_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1099 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  CONSTRAINT `recipe_oil_quench_speed_ibfk_1` FOREIGN KEY (`oil_quench_id`) REFERENCES `recipe_oil_quench` (`oil_quench_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. recipe_preox_cycle
CREATE TABLE IF NOT EXISTS `recipe_preox_cycle` (
  `preox_cycle_id` int NOT NULL AUTO_INCREMENT,
  `recipe_id` int DEFAULT NULL,
  `media` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_unit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temperature_unit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `temperature_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`preox_cycle_id`),
  UNIQUE KEY `recipe_id` (`recipe_id`),
  KEY `duration_unit` (`duration_unit`),
  KEY `temperature_unit` (`temperature_unit`),
  CONSTRAINT `recipe_preox_cycle_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `recipe_preox_cycle_ibfk_2` FOREIGN KEY (`duration_unit`) REFERENCES `ref_units` (`name`),
  CONSTRAINT `recipe_preox_cycle_ibfk_3` FOREIGN KEY (`temperature_unit`) REFERENCES `ref_units` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1099 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  CONSTRAINT `recipe_thermal_cycle_ibfk_1` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2826 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_cooling_media
CREATE TABLE IF NOT EXISTS `ref_cooling_media` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_country
CREATE TABLE IF NOT EXISTS `ref_country` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom du pays - Clé primaire',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_designation
CREATE TABLE IF NOT EXISTS `ref_designation` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Type de désignation - Clé primaire',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_file_category
CREATE TABLE IF NOT EXISTS `ref_file_category` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom de la catégorie - Clé primaire',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_file_subcategory
CREATE TABLE IF NOT EXISTS `ref_file_subcategory` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom de la sous-catégorie - Clé primaire',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_file_types
CREATE TABLE IF NOT EXISTS `ref_file_types` (
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `parent_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Type d''entité associée (trial, part, client, etc.)',
  `storage_path_template` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Template de path: {entity_type}/{entity_id}/{file_type}',
  `is_active` tinyint(1) DEFAULT '1',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`code`),
  KEY `idx_entity_type` (`entity_type`),
  KEY `idx_parent_type` (`parent_type`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_ref_file_types_parent` FOREIGN KEY (`parent_type`) REFERENCES `ref_file_types` (`code`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Types de fichiers unifiés avec hiérarchie';

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
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom de l''emplacement - Clé primaire',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_mounting_type
CREATE TABLE IF NOT EXISTS `ref_mounting_type` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Type de montage - Clé primaire',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_node_data_status
CREATE TABLE IF NOT EXISTS `ref_node_data_status` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Code du statut (ex: new, old, opened) - Clé primaire',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_position_type
CREATE TABLE IF NOT EXISTS `ref_position_type` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Type de position - Clé primaire',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_process_type
CREATE TABLE IF NOT EXISTS `ref_process_type` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Type de processus - Clé primaire',
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
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom du rôle - Clé primaire',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_status
CREATE TABLE IF NOT EXISTS `ref_status` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Statut - Clé primaire',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_steel_elements
CREATE TABLE IF NOT EXISTS `ref_steel_elements` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom de l''élément chimique - Clé primaire',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_steel_family
CREATE TABLE IF NOT EXISTS `ref_steel_family` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom de la famille d''acier - Clé primaire',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_steel_standard
CREATE TABLE IF NOT EXISTS `ref_steel_standard` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom du standard - Clé primaire',
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_units
CREATE TABLE IF NOT EXISTS `ref_units` (
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom de l''unité - Clé primaire',
  `unit_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Type d''unité (longueur, poids, température...)',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Description de l''unité',
  PRIMARY KEY (`name`),
  KEY `unit_type` (`unit_type`),
  CONSTRAINT `ref_units_ibfk_1` FOREIGN KEY (`unit_type`) REFERENCES `ref_unit_types` (`type_name`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. ref_unit_types
CREATE TABLE IF NOT EXISTS `ref_unit_types` (
  `type_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom du type d''unité - Clé primaire',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Description du type',
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
  CONSTRAINT `results_curve_points_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `results_curve_series` (`series_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=68508 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. results_curve_series
CREATE TABLE IF NOT EXISTS `results_curve_series` (
  `series_id` int NOT NULL AUTO_INCREMENT,
  `sample_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`series_id`),
  KEY `sample_id` (`sample_id`),
  CONSTRAINT `results_curve_series_ibfk_1` FOREIGN KEY (`sample_id`) REFERENCES `results_samples` (`sample_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6506 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. results_ecd_positions
CREATE TABLE IF NOT EXISTS `results_ecd_positions` (
  `ecd_position_id` int NOT NULL AUTO_INCREMENT,
  `sample_id` int NOT NULL,
  `distance` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ecd_position_id`),
  KEY `sample_id` (`sample_id`),
  CONSTRAINT `results_ecd_positions_ibfk_1` FOREIGN KEY (`sample_id`) REFERENCES `results_samples` (`sample_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3160 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  CONSTRAINT `results_hardness_points_ibfk_1` FOREIGN KEY (`sample_id`) REFERENCES `results_samples` (`sample_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  CONSTRAINT `results_samples_ibfk_1` FOREIGN KEY (`result_step_id`) REFERENCES `results_steps` (`result_step_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3118 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. results_steps
CREATE TABLE IF NOT EXISTS `results_steps` (
  `result_step_id` int NOT NULL AUTO_INCREMENT,
  `trial_node_id` int NOT NULL,
  `step_number` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`result_step_id`),
  KEY `trial_node_id` (`trial_node_id`),
  CONSTRAINT `results_steps_ibfk_1` FOREIGN KEY (`trial_node_id`) REFERENCES `trials` (`node_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1861 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. specs_ecd
CREATE TABLE IF NOT EXISTS `specs_ecd` (
  `spec_id` int NOT NULL AUTO_INCREMENT COMMENT 'ID unique de la spécification ECD',
  `part_node_id` int NOT NULL COMMENT 'FK vers la pièce concernée',
  `name` text COLLATE utf8mb4_unicode_ci COMMENT 'Nom/description de la spécification',
  `depthMin` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Profondeur minimale de la couche',
  `depthMax` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Profondeur maximale de la couche',
  `depthUnit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unité de profondeur - FK vers ref_units.name',
  `hardness` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valeur de dureté en surface',
  `hardnessUnit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unité de dureté - FK vers ref_units.name',
  PRIMARY KEY (`spec_id`),
  KEY `idx_specs_ecd_part` (`part_node_id`),
  KEY `fk_spec_ecd_depth_unit` (`depthUnit`),
  KEY `fk_spec_ecd_hard_unit` (`hardnessUnit`),
  CONSTRAINT `specs_ecd_ibfk_1` FOREIGN KEY (`part_node_id`) REFERENCES `parts` (`node_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `specs_ecd_ibfk_2` FOREIGN KEY (`depthUnit`) REFERENCES `ref_units` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `specs_ecd_ibfk_3` FOREIGN KEY (`hardnessUnit`) REFERENCES `ref_units` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=816 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. specs_hardness
CREATE TABLE IF NOT EXISTS `specs_hardness` (
  `spec_id` int NOT NULL AUTO_INCREMENT COMMENT 'ID unique de la spécification de dureté',
  `part_node_id` int NOT NULL COMMENT 'FK vers la pièce concernée',
  `name` text COLLATE utf8mb4_unicode_ci COMMENT 'Nom/description de la spécification',
  `min` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valeur minimale de dureté',
  `max` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valeur maximale de dureté',
  `unit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unité de dureté - FK vers ref_units.name',
  PRIMARY KEY (`spec_id`),
  KEY `idx_specs_hardness_part` (`part_node_id`),
  KEY `fk_spec_hard_unit` (`unit`),
  CONSTRAINT `specs_hardness_ibfk_1` FOREIGN KEY (`part_node_id`) REFERENCES `parts` (`node_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `specs_hardness_ibfk_2` FOREIGN KEY (`unit`) REFERENCES `ref_units` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=877 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. steels
CREATE TABLE IF NOT EXISTS `steels` (
  `node_id` int NOT NULL COMMENT '? RELATION FONDAMENTALE : Référence au nœud parent',
  `grade` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Grade de l''acier',
  `family` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Famille d''acier - FK vers ref_steel_family.name',
  `standard` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Standard de l''acier - FK vers ref_steel_standard.name',
  `elements` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Éléments chimiques - FK vers ref_steel_elements.name',
  `chemistery` json DEFAULT NULL COMMENT 'Composition chimique détaillée (JSON conservé)',
  PRIMARY KEY (`node_id`),
  KEY `idx_steel_grade` (`grade`),
  KEY `fk_steels_family` (`family`),
  KEY `fk_steels_standard` (`standard`),
  KEY `fk_steels_elements` (`elements`),
  CONSTRAINT `steels_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `steels_ibfk_2` FOREIGN KEY (`family`) REFERENCES `ref_steel_family` (`name`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `steels_ibfk_3` FOREIGN KEY (`standard`) REFERENCES `ref_steel_standard` (`name`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `steels_ibfk_4` FOREIGN KEY (`elements`) REFERENCES `ref_steel_elements` (`name`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. steel_equivalents
CREATE TABLE IF NOT EXISTS `steel_equivalents` (
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `steel_node_id` int NOT NULL,
  `equivalent_steel_node_id` int NOT NULL,
  PRIMARY KEY (`steel_node_id`,`equivalent_steel_node_id`),
  KEY `equivalent_steel_node_id` (`equivalent_steel_node_id`),
  CONSTRAINT `steel_equivalents_ibfk_1` FOREIGN KEY (`steel_node_id`) REFERENCES `steels` (`node_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `steel_equivalents_ibfk_2` FOREIGN KEY (`equivalent_steel_node_id`) REFERENCES `steels` (`node_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. trials
CREATE TABLE IF NOT EXISTS `trials` (
  `node_id` int NOT NULL COMMENT '? RELATION FONDAMENTALE : Référence au nœud parent',
  `recipe_id` int DEFAULT NULL COMMENT 'Référence vers la recette utilisée',
  `furnace_id` int DEFAULT NULL COMMENT 'Référence vers le four utilisé',
  `trial_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Code de l''essai',
  `load_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Numéro de charge',
  `trial_date` date DEFAULT NULL COMMENT 'Date de l''essai',
  `status` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Statut de l''essai - FK vers ref_status.name',
  `location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Lieu de l''essai - FK vers ref_location.name',
  `load_weight_unit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unité de poids de la charge - FK vers ref_units.name',
  `load_weight_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valeur du poids de la charge',
  `load_size_width_unit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unité largeur - FK vers ref_units.name',
  `load_size_width_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valeur largeur',
  `load_size_height_unit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unité hauteur - FK vers ref_units.name',
  `load_size_height_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valeur hauteur',
  `load_size_length_unit` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Unité longueur - FK vers ref_units.name',
  `load_size_length_value` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Valeur longueur',
  `load_part_count` int DEFAULT NULL COMMENT 'Nombre de pièces dans la charge',
  `load_floor_count` int DEFAULT NULL COMMENT 'Nombre d''étages dans la charge',
  `load_comments` text COLLATE utf8mb4_unicode_ci COMMENT 'Commentaires sur la charge',
  `mounting_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Type de montage - FK vers ref_mounting_type.name',
  `position_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Type de position - FK vers ref_position_type.name',
  `process_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Type de processus - FK vers ref_process_type.name',
  PRIMARY KEY (`node_id`),
  KEY `load_weight_unit` (`load_weight_unit`),
  KEY `load_size_width_unit` (`load_size_width_unit`),
  KEY `load_size_height_unit` (`load_size_height_unit`),
  KEY `load_size_length_unit` (`load_size_length_unit`),
  KEY `idx_trials_recipe` (`recipe_id`),
  KEY `idx_trials_furnace` (`furnace_id`),
  KEY `fk_trials_status` (`status`),
  KEY `fk_trials_location` (`location`),
  KEY `fk_trials_mounting_type` (`mounting_type`),
  KEY `fk_trials_position_type` (`position_type`),
  KEY `fk_trials_process_type` (`process_type`),
  CONSTRAINT `trials_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `trials_ibfk_10` FOREIGN KEY (`mounting_type`) REFERENCES `ref_mounting_type` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `trials_ibfk_11` FOREIGN KEY (`position_type`) REFERENCES `ref_position_type` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `trials_ibfk_12` FOREIGN KEY (`process_type`) REFERENCES `ref_process_type` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `trials_ibfk_2` FOREIGN KEY (`recipe_id`) REFERENCES `recipes` (`recipe_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `trials_ibfk_3` FOREIGN KEY (`furnace_id`) REFERENCES `furnaces` (`furnace_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `trials_ibfk_4` FOREIGN KEY (`status`) REFERENCES `ref_status` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `trials_ibfk_5` FOREIGN KEY (`location`) REFERENCES `ref_location` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `trials_ibfk_6` FOREIGN KEY (`load_weight_unit`) REFERENCES `ref_units` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `trials_ibfk_7` FOREIGN KEY (`load_size_width_unit`) REFERENCES `ref_units` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `trials_ibfk_8` FOREIGN KEY (`load_size_height_unit`) REFERENCES `ref_units` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `trials_ibfk_9` FOREIGN KEY (`load_size_length_unit`) REFERENCES `ref_units` (`name`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergia. trial_requests
CREATE TABLE IF NOT EXISTS `trial_requests` (
  `node_id` int NOT NULL COMMENT '? RELATION : Clé primaire et clé étrangère vers nodes.id',
  `request_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Numéro de la demande d''essai (ex: TRQ_2024-01-15)',
  `request_date` date DEFAULT NULL COMMENT 'Date de la demande d''essai',
  `commercial` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Nom du commercial responsable',
  PRIMARY KEY (`node_id`),
  KEY `idx_request_number` (`request_number`),
  KEY `idx_request_date` (`request_date`),
  CONSTRAINT `trial_requests_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom d''utilisateur unique',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Hash du mot de passe',
  `role` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Rôle de l''utilisateur - FK vers ref_roles.name',
  `created_at` datetime DEFAULT NULL COMMENT 'Date de création du compte',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_username` (`username`),
  KEY `fk_users_role` (`role`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role`) REFERENCES `ref_roles` (`name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de vue synergia. v_files_legacy
-- Création d'une table temporaire pour palier aux erreurs de dépendances de VIEW
CREATE TABLE `v_files_legacy` (
	`node_id` INT(10) NOT NULL COMMENT '? RELATION FONDAMENTALE : Référence au nœud parent',
	`original_name` VARCHAR(255) NOT NULL COMMENT 'Nom original du fichier' COLLATE 'utf8mb4_unicode_ci',
	`file_path` VARCHAR(1000) NOT NULL COMMENT 'Chemin de stockage du fichier' COLLATE 'utf8mb4_unicode_ci',
	`storage_key` VARCHAR(500) NULL COLLATE 'utf8mb4_unicode_ci',
	`size` BIGINT(19) NULL COMMENT 'Taille du fichier en octets',
	`mime_type` VARCHAR(100) NULL COMMENT 'Type MIME du fichier' COLLATE 'utf8mb4_unicode_ci',
	`checksum` VARCHAR(64) NULL COMMENT 'Empreinte du fichier (checksum)' COLLATE 'utf8mb4_unicode_ci',
	`category` LONGTEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`subcategory` LONGTEXT NULL COLLATE 'utf8mb4_unicode_ci',
	`context` JSON NULL,
	`version` INT(10) NULL,
	`is_latest` TINYINT(1) NULL,
	`uploaded_by` INT(10) NULL,
	`uploaded_at` TIMESTAMP NULL,
	`modified_at` TIMESTAMP NULL,
	`name` VARCHAR(255) NOT NULL COMMENT 'Nom du nœud' COLLATE 'utf8mb4_unicode_ci',
	`path` VARCHAR(1000) NOT NULL COMMENT 'Chemin complet dans la hiérarchie' COLLATE 'utf8mb4_unicode_ci',
	`type` ENUM('client','trial_request','trial','file','part','furnace','steel') NOT NULL COMMENT 'Type de nœud (détermine la table de données associée)' COLLATE 'utf8mb4_unicode_ci',
	`parent_id` INT(10) NULL COMMENT 'Référence au nœud parent (relation directe)',
	`data_status` VARCHAR(100) NOT NULL COMMENT 'Statut des données (NEW, OLD, OPENED) - FK vers ref_node_data_status.name' COLLATE 'utf8mb4_unicode_ci'
) ENGINE=MyISAM;

-- Listage de la structure de vue synergia. v_files_legacy
-- Suppression de la table temporaire et création finale de la structure d'une vue
DROP TABLE IF EXISTS `v_files_legacy`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `v_files_legacy` AS select `f`.`node_id` AS `node_id`,`f`.`original_name` AS `original_name`,`f`.`file_path` AS `file_path`,`f`.`storage_key` AS `storage_key`,`f`.`size` AS `size`,`f`.`mime_type` AS `mime_type`,`f`.`checksum` AS `checksum`,coalesce(`f`.`category`,json_unquote(json_extract(`f`.`context`,'$.file_type'))) AS `category`,coalesce(`f`.`subcategory`,json_unquote(json_extract(`f`.`context`,'$.file_subtype'))) AS `subcategory`,`f`.`context` AS `context`,`f`.`version` AS `version`,`f`.`is_latest` AS `is_latest`,`f`.`uploaded_by` AS `uploaded_by`,`f`.`uploaded_at` AS `uploaded_at`,`f`.`modified_at` AS `modified_at`,`n`.`name` AS `name`,`n`.`path` AS `path`,`n`.`type` AS `type`,`n`.`parent_id` AS `parent_id`,`n`.`data_status` AS `data_status` from (`files` `f` join `nodes` `n` on((`f`.`node_id` = `n`.`id`)));

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
