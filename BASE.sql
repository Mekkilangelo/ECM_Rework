-- --------------------------------------------------------
-- Hôte:                         127.0.0.1
-- Version du serveur:           8.0.30 - MySQL Community Server - GPL
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

-- Listage de la structure de table synergy. clients
CREATE TABLE IF NOT EXISTS `clients` (
  `node_id` int NOT NULL,
  `client_code` varchar(50) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `country` enum('USA','...') DEFAULT NULL,
  `client_group` varchar(50) DEFAULT NULL,
  `address` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  UNIQUE KEY `client_code` (`client_code`),
  UNIQUE KEY `client_code_2` (`client_code`),
  UNIQUE KEY `client_code_3` (`client_code`),
  UNIQUE KEY `client_code_4` (`client_code`),
  UNIQUE KEY `client_code_5` (`client_code`),
  UNIQUE KEY `client_code_6` (`client_code`),
  UNIQUE KEY `client_code_7` (`client_code`),
  UNIQUE KEY `client_code_8` (`client_code`),
  UNIQUE KEY `client_code_9` (`client_code`),
  UNIQUE KEY `client_code_10` (`client_code`),
  UNIQUE KEY `client_code_11` (`client_code`),
  UNIQUE KEY `client_code_12` (`client_code`),
  UNIQUE KEY `client_code_13` (`client_code`),
  UNIQUE KEY `client_code_14` (`client_code`),
  UNIQUE KEY `client_code_15` (`client_code`),
  UNIQUE KEY `client_code_16` (`client_code`),
  UNIQUE KEY `client_code_17` (`client_code`),
  UNIQUE KEY `client_code_18` (`client_code`),
  UNIQUE KEY `client_code_19` (`client_code`),
  UNIQUE KEY `client_code_20` (`client_code`),
  UNIQUE KEY `client_code_21` (`client_code`),
  UNIQUE KEY `client_code_22` (`client_code`),
  UNIQUE KEY `client_code_23` (`client_code`),
  UNIQUE KEY `client_code_24` (`client_code`),
  CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergy. closure
CREATE TABLE IF NOT EXISTS `closure` (
  `ancestor_id` int NOT NULL,
  `descendant_id` int NOT NULL,
  `depth` int DEFAULT NULL,
  PRIMARY KEY (`ancestor_id`,`descendant_id`),
  KEY `descendant_id` (`descendant_id`),
  CONSTRAINT `closure_ibfk_1` FOREIGN KEY (`ancestor_id`) REFERENCES `nodes` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `closure_ibfk_2` FOREIGN KEY (`descendant_id`) REFERENCES `nodes` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergy. files
CREATE TABLE IF NOT EXISTS `files` (
  `node_id` int NOT NULL,
  `size` bigint DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `checksum` varchar(64) DEFAULT NULL,
  `additional_info` json DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  CONSTRAINT `files_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergy. furnaces
CREATE TABLE IF NOT EXISTS `furnaces` (
  `node_id` int NOT NULL AUTO_INCREMENT,
  `furnace_type` enum('Eco','Nano','Flex','Jumbo','PREO','Temper','FOUR','furnace') DEFAULT NULL,
  `furnace_size` enum('6-4-4','6-5-2','9-6-6','1-2-9-9') DEFAULT NULL,
  `heating_cell_type` enum('CRV','CCF','CCN') DEFAULT NULL,
  `cooling_media` enum('Oil','N2','He') DEFAULT NULL,
  `process_type` enum('Annealing','Preox','Hardening','Nitiring','Nitrocarburizing','Post ox','Carburizing','Cabonitriding','Tempering','Brazing','Sintering','Oxidizing','Debinding','Melting','Step Quenching','DATAPAQ') DEFAULT NULL,
  `quench_cell` enum('CTG 21H','CTG 27H') DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  CONSTRAINT `furnaces_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergy. nodes
CREATE TABLE IF NOT EXISTS `nodes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `path` varchar(1000) NOT NULL,
  `type` enum('client','order','test','file','part','furnace','steel') NOT NULL,
  `parent_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `modified_at` datetime DEFAULT NULL,
  `data_status` enum('new','old','opened') NOT NULL DEFAULT 'old',
  `description` text,
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `nodes_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_10` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_11` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_12` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_13` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_14` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_15` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_16` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_17` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_18` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_19` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_20` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_21` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_22` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_23` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_24` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_4` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_5` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_6` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_7` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_8` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_9` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergy. orders
CREATE TABLE IF NOT EXISTS `orders` (
  `node_id` int NOT NULL,
  `order_number` varchar(50) DEFAULT NULL,
  `order_date` date DEFAULT NULL,
  `commercial` varchar(50) DEFAULT NULL,
  `contacts` json DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  UNIQUE KEY `order_number` (`order_number`),
  UNIQUE KEY `order_number_2` (`order_number`),
  UNIQUE KEY `order_number_3` (`order_number`),
  UNIQUE KEY `order_number_4` (`order_number`),
  UNIQUE KEY `order_number_5` (`order_number`),
  UNIQUE KEY `order_number_6` (`order_number`),
  UNIQUE KEY `order_number_7` (`order_number`),
  UNIQUE KEY `order_number_8` (`order_number`),
  UNIQUE KEY `order_number_9` (`order_number`),
  UNIQUE KEY `order_number_10` (`order_number`),
  UNIQUE KEY `order_number_11` (`order_number`),
  UNIQUE KEY `order_number_12` (`order_number`),
  UNIQUE KEY `order_number_13` (`order_number`),
  UNIQUE KEY `order_number_14` (`order_number`),
  UNIQUE KEY `order_number_15` (`order_number`),
  UNIQUE KEY `order_number_16` (`order_number`),
  UNIQUE KEY `order_number_17` (`order_number`),
  UNIQUE KEY `order_number_18` (`order_number`),
  UNIQUE KEY `order_number_19` (`order_number`),
  UNIQUE KEY `order_number_20` (`order_number`),
  UNIQUE KEY `order_number_21` (`order_number`),
  UNIQUE KEY `order_number_22` (`order_number`),
  UNIQUE KEY `order_number_23` (`order_number`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergy. parts
CREATE TABLE IF NOT EXISTS `parts` (
  `node_id` int NOT NULL,
  `designation` enum('Pinion','InGear','OutGear','Ring') DEFAULT NULL,
  `dimensions` json DEFAULT NULL,
  `specifications` json DEFAULT NULL,
  `steel` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  CONSTRAINT `parts_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergy. steels
CREATE TABLE IF NOT EXISTS `steels` (
  `node_id` int NOT NULL,
  `grade` varchar(50) DEFAULT NULL,
  `family` enum('Low_alloyed','Stainless_steel','Tool_steel','Construction_steel','Austenitic','Ferritic','Martensitic','Duplex','HSS','HCC') DEFAULT NULL,
  `standard` enum('GOST_1050','EN_10020','ASTM_AISI') DEFAULT NULL,
  `equivalents` json DEFAULT NULL,
  `chemistery` json DEFAULT NULL,
  `elements` enum('C - Carbon','Si - Silicon','Mn - Manganese','P - Phosphorus','S - Sulfur','Cr - Chromium','Ni - Nickel','Mo - Molybdenum','V - Vanadium','W - Tungsten','Co - Cobalt','Ti - Titanium','Al - Aluminum','Nb - Niobium','Zr - Zirconium','Cu - Copper','N - Nitrogen','O - Oxygen','H - Hydrogen','B - Boron','Pb - Lead','Sn - Tin','Zn - Zinc','Fe - Iron','As - Arsenic','Mg - Magnesium','Ca - Calcium','Ta - Tantalum','Re - Rhenium') DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  CONSTRAINT `steels_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergy. tests
CREATE TABLE IF NOT EXISTS `tests` (
  `node_id` int NOT NULL,
  `test_code` varchar(50) DEFAULT NULL,
  `test_date` date DEFAULT NULL,
  `status` enum('passe','echoue','en_cours','planned') DEFAULT NULL,
  `location` enum('ECM','site') DEFAULT NULL,
  `is_mesured` enum('Oui','Non') DEFAULT NULL,
  `furnace_data` json DEFAULT NULL,
  `load_data` json DEFAULT NULL,
  `recipe_data` json DEFAULT NULL,
  `quench_data` json DEFAULT NULL,
  `results_data` json DEFAULT NULL,
  `mounting_type` enum('Support_Rack','Hanging','Fixture','Tray','Conveyor_Belt') DEFAULT NULL,
  `position_type` enum('Horizontal','Vertical','Rotary','Stationary','Oscillating') DEFAULT NULL,
  `process_type` enum('Annealing','Quenching','Tempering','Carburizing','Nitriding') DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  CONSTRAINT `tests_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergy. users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','user','superuser') NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `username_2` (`username`),
  UNIQUE KEY `username_3` (`username`),
  UNIQUE KEY `username_4` (`username`),
  UNIQUE KEY `username_5` (`username`),
  UNIQUE KEY `username_6` (`username`),
  UNIQUE KEY `username_7` (`username`),
  UNIQUE KEY `username_8` (`username`),
  UNIQUE KEY `username_9` (`username`),
  UNIQUE KEY `username_10` (`username`),
  UNIQUE KEY `username_11` (`username`),
  UNIQUE KEY `username_12` (`username`),
  UNIQUE KEY `username_13` (`username`),
  UNIQUE KEY `username_14` (`username`),
  UNIQUE KEY `username_15` (`username`),
  UNIQUE KEY `username_16` (`username`),
  UNIQUE KEY `username_17` (`username`),
  UNIQUE KEY `username_18` (`username`),
  UNIQUE KEY `username_19` (`username`),
  UNIQUE KEY `username_20` (`username`),
  UNIQUE KEY `username_21` (`username`),
  UNIQUE KEY `username_22` (`username`),
  UNIQUE KEY `username_23` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
