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

-- Listage des données de la table synergy.closure : ~14 rows (environ)
INSERT INTO `closure` (`ancestor_id`, `descendant_id`, `depth`) VALUES
	(1, 1, 0),
	(1, 3, 1),
	(1, 4, 2),
	(1, 5, 1),
	(1, 6, 3),
	(2, 2, 0),
	(2, 7, 1),
	(2, 11, 2),
	(3, 3, 0),
	(3, 4, 1),
	(3, 6, 2),
	(4, 4, 0),
	(4, 6, 1),
	(5, 5, 0),
	(6, 6, 0),
	(7, 7, 0),
	(7, 11, 1),
	(8, 8, 0),
	(11, 11, 0);

-- Listage de la structure de table synergy. files
CREATE TABLE IF NOT EXISTS `files` (
  `node_id` int NOT NULL,
  `size` bigint DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `checksum` varchar(64) DEFAULT NULL,
  `additional_info` json DEFAULT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(1000) NOT NULL,
  `category` varchar(50) DEFAULT NULL COMMENT 'Pour organiser par type: "general", "photos", "curves", etc.',
  `subcategory` varchar(50) DEFAULT NULL COMMENT 'Pour préciser: "top_view", "heating_curve", etc.',
  PRIMARY KEY (`node_id`),
  CONSTRAINT `files_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.files : ~5 rows (environ)
INSERT INTO `files` (`node_id`, `size`, `mime_type`, `checksum`, `additional_info`, `original_name`, `file_path`, `category`, `subcategory`) VALUES
	(9, 306442, 'image/png', NULL, '{"temp_id": "temp-9a35e237-8245-4f3f-ab5b-258f6ea6841a", "upload_date": "2025-03-27T08:46:03.106Z"}', 'Capture d\'Ã©cran 2023-09-30 124312.png', 'C:\\Users\\mekki\\Desktop\\Mekki\\Code\\Rework_ECM\\server\\uploads\\temp\\5e5e7bae-955e-45e0-bdfd-c1f74ab1ddc4.png', 'photos', 'front'),
	(10, 21707, 'image/png', NULL, '{"temp_id": "temp-9a35e237-8245-4f3f-ab5b-258f6ea6841a", "upload_date": "2025-03-27T08:46:03.633Z"}', 'Capture d\'Ã©cran 2024-02-03 190536.png', 'C:\\Users\\mekki\\Desktop\\Mekki\\Code\\Rework_ECM\\server\\uploads\\temp\\2a0a12e1-5833-474b-8f04-698975d1c9a1.png', 'photos', 'front'),
	(12, 231693, 'image/png', NULL, '{"temp_id": null, "upload_date": "2025-03-27T08:46:53.033Z"}', 'Capture d\'Ã©cran 2023-09-30 124735.png', 'C:\\Users\\mekki\\Desktop\\Mekki\\Code\\Rework_ECM\\server\\uploads\\ECM\\TRQ_2025-03-27\\PIECEPHOTO\\photos\\front\\e4c5db93-2c91-46a3-a769-27c4ea829369.png', 'photos', 'front'),
	(13, 1505, 'image/png', NULL, '{"temp_id": null, "upload_date": "2025-03-27T08:46:53.045Z"}', 'Capture d\'Ã©cran 2024-09-20 170019.png', 'C:\\Users\\mekki\\Desktop\\Mekki\\Code\\Rework_ECM\\server\\uploads\\ECM\\TRQ_2025-03-27\\PIECEPHOTO\\photos\\front\\216a367f-3b01-4545-97ae-a53ceaa2b304.png', 'photos', 'front'),
	(14, 1406365, 'image/png', NULL, '{"temp_id": null, "upload_date": "2025-03-27T08:46:57.509Z"}', 'Capture d\'Ã©cran 2023-08-26 015108.png', 'C:\\Users\\mekki\\Desktop\\Mekki\\Code\\Rework_ECM\\server\\uploads\\ECM\\TRQ_2025-03-27\\PIECEPHOTO\\photos\\profile\\07320ef3-3926-415d-b4f3-42ca84913623.png', 'photos', 'profile');

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
  CONSTRAINT `nodes_ibfk_25` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_26` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_27` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_28` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_29` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_3` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_30` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_31` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_32` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_33` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_34` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_35` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_36` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_37` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_38` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_39` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_4` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_40` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_41` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_42` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_43` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_44` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_45` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_46` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_47` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_48` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_49` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_5` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_50` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_51` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_52` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_53` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_54` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_55` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_56` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_57` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_58` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_59` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_6` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_60` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_61` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_62` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_63` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_7` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_8` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_9` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.nodes : ~14 rows (environ)
INSERT INTO `nodes` (`id`, `name`, `path`, `type`, `parent_id`, `created_at`, `modified_at`, `data_status`, `description`) VALUES
	(1, 'CustomIA', '/CustomIA', 'client', NULL, '2025-03-23 11:36:09', '2025-03-23 11:36:42', 'opened', 'boite qui fait de l\'ia'),
	(2, 'ECM', '/ECM', 'client', NULL, '2025-03-23 11:42:32', '2025-03-23 23:07:19', 'opened', 'ECM CLient'),
	(3, 'TRQ_2025-03-23', '/CustomIA/TRQ_2025-03-23', 'order', 1, '2025-03-23 13:14:30', '2025-03-23 13:44:59', 'opened', 'Demande de monitoring'),
	(4, 'C3PO', '/CustomIA/TRQ_2025-03-23/C3PO', 'part', 3, '2025-03-23 13:29:13', '2025-03-23 13:46:20', 'opened', 'test part'),
	(5, 'TRQ_2025-03-30', '/CustomIA/TRQ_2025-03-30', 'order', 1, '2025-03-23 13:30:12', '2025-03-23 13:30:16', 'opened', 'Raph'),
	(6, 'TEST_1', '/CustomIA/TRQ_2025-03-23/C3PO/TEST_1', 'test', 4, '2025-03-23 13:49:32', '2025-03-23 13:59:20', 'opened', 'test1'),
	(7, 'TRQ_2025-03-27', '/ECM/TRQ_2025-03-27', 'order', 2, '2025-03-27 08:43:40', '2025-03-27 08:43:43', 'opened', 'test'),
	(8, '20MnCr5', '/20MnCr5', 'steel', NULL, '2025-03-27 08:45:29', '2025-03-27 08:45:29', 'new', NULL),
	(9, 'Capture d\'Ã©cran 2023-09-30 124312.png', '/temp/temp-9a35e237-8245-4f3f-ab5b-258f6ea6841a/5e5e7bae-955e-45e0-bdfd-c1f74ab1ddc4.png', 'file', NULL, '2025-03-27 08:46:02', NULL, 'new', 'File uploaded as photos/front'),
	(10, 'Capture d\'Ã©cran 2024-02-03 190536.png', '/temp/temp-9a35e237-8245-4f3f-ab5b-258f6ea6841a/2a0a12e1-5833-474b-8f04-698975d1c9a1.png', 'file', NULL, '2025-03-27 08:46:03', NULL, 'new', 'File uploaded as photos/front'),
	(11, 'PIECEPHOTO', '/ECM/TRQ_2025-03-27/PIECEPHOTO', 'part', 7, '2025-03-27 08:46:15', '2025-03-27 09:10:19', 'new', 'test  de piece'),
	(12, 'Capture d\'Ã©cran 2023-09-30 124735.png', '/ECM/TRQ_2025-03-27/PIECEPHOTO/photos/front/Capture d\'Ã©cran 2023-09-30 124735.png', 'file', 11, '2025-03-27 08:46:53', NULL, 'new', 'File uploaded as photos/front'),
	(13, 'Capture d\'Ã©cran 2024-09-20 170019.png', '/ECM/TRQ_2025-03-27/PIECEPHOTO/photos/front/Capture d\'Ã©cran 2024-09-20 170019.png', 'file', 11, '2025-03-27 08:46:53', NULL, 'new', 'File uploaded as photos/front'),
	(14, 'Capture d\'Ã©cran 2023-08-26 015108.png', '/ECM/TRQ_2025-03-27/PIECEPHOTO/photos/profile/Capture d\'Ã©cran 2023-08-26 015108.png', 'file', 11, '2025-03-27 08:46:57', NULL, 'new', 'File uploaded as photos/profile');

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
  UNIQUE KEY `order_number_24` (`order_number`),
  UNIQUE KEY `order_number_25` (`order_number`),
  UNIQUE KEY `order_number_26` (`order_number`),
  UNIQUE KEY `order_number_27` (`order_number`),
  UNIQUE KEY `order_number_28` (`order_number`),
  UNIQUE KEY `order_number_29` (`order_number`),
  UNIQUE KEY `order_number_30` (`order_number`),
  UNIQUE KEY `order_number_31` (`order_number`),
  UNIQUE KEY `order_number_32` (`order_number`),
  UNIQUE KEY `order_number_33` (`order_number`),
  UNIQUE KEY `order_number_34` (`order_number`),
  UNIQUE KEY `order_number_35` (`order_number`),
  UNIQUE KEY `order_number_36` (`order_number`),
  UNIQUE KEY `order_number_37` (`order_number`),
  UNIQUE KEY `order_number_38` (`order_number`),
  UNIQUE KEY `order_number_39` (`order_number`),
  UNIQUE KEY `order_number_40` (`order_number`),
  UNIQUE KEY `order_number_41` (`order_number`),
  UNIQUE KEY `order_number_42` (`order_number`),
  UNIQUE KEY `order_number_43` (`order_number`),
  UNIQUE KEY `order_number_44` (`order_number`),
  UNIQUE KEY `order_number_45` (`order_number`),
  UNIQUE KEY `order_number_46` (`order_number`),
  UNIQUE KEY `order_number_47` (`order_number`),
  UNIQUE KEY `order_number_48` (`order_number`),
  UNIQUE KEY `order_number_49` (`order_number`),
  UNIQUE KEY `order_number_50` (`order_number`),
  UNIQUE KEY `order_number_51` (`order_number`),
  UNIQUE KEY `order_number_52` (`order_number`),
  UNIQUE KEY `order_number_53` (`order_number`),
  UNIQUE KEY `order_number_54` (`order_number`),
  UNIQUE KEY `order_number_55` (`order_number`),
  UNIQUE KEY `order_number_56` (`order_number`),
  UNIQUE KEY `order_number_57` (`order_number`),
  UNIQUE KEY `order_number_58` (`order_number`),
  UNIQUE KEY `order_number_59` (`order_number`),
  UNIQUE KEY `order_number_60` (`order_number`),
  UNIQUE KEY `order_number_61` (`order_number`),
  UNIQUE KEY `order_number_62` (`order_number`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.orders : ~3 rows (environ)
INSERT INTO `orders` (`node_id`, `order_number`, `order_date`, `commercial`, `contacts`) VALUES
	(3, 'TRQ_3', '2025-03-24', 'Oscar', '[{"name": "Abs Mekki", "email": "mk@fr.frr", "phone": "0636472720"}]'),
	(5, 'TRQ_5', '2025-03-30', 'Raph', '[{"name": "DD", "email": "", "phone": ""}, {"name": "BOBO", "email": "", "phone": ""}]'),
	(7, 'TRQ_7', '2025-03-27', 'Oscar', '[]');

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

-- Listage des données de la table synergy.parts : ~0 rows (environ)
INSERT INTO `parts` (`node_id`, `designation`, `dimensions`, `specifications`, `steel`) VALUES
	(4, 'Ring', '{"weight": {"unit": "kg", "value": "6"}, "circular": {"unit": "mm", "diameterIn": "4", "diameterOut": "5"}, "rectangular": {"unit": "mm", "width": "2", "height": "3", "length": "1"}}', '{"ecd": {"unit": "HC_60", "depthMax": "12", "depthMin": "11", "hardness": "13"}, "coreHardness": {"max": "8", "min": "7", "unit": "HC_30"}, "surfaceHardness": {"max": "10", "min": "9", "unit": "HV_200"}}', ''),
	(11, 'Pinion', '{"weight": {"unit": "kg", "value": "6"}, "circular": {"unit": "mm", "diameterIn": "4", "diameterOut": "5"}, "rectangular": {"unit": "mm", "width": "2", "height": "3", "length": "1"}}', '{"ecd": {"unit": "HC_30", "depthMax": "12", "depthMin": "11", "hardness": "13"}, "coreHardness": {"max": "8", "min": "7", "unit": "HC_20"}, "surfaceHardness": {"max": "10", "min": "9", "unit": "HC_45"}}', '20MnCr5');

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

-- Listage des données de la table synergy.steels : ~0 rows (environ)
INSERT INTO `steels` (`node_id`, `grade`, `family`, `standard`, `equivalents`, `chemistery`, `elements`) VALUES
	(8, '20MnCr5', 'Low_alloyed', 'GOST_1050', '[]', '[{"value": 30, "element": "C - Carbon", "max_value": null, "min_value": null}, {"value": 40, "element": "Mn - Manganese", "max_value": null, "min_value": null}]', NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
