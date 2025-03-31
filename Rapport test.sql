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
  `country` enum('USA','AFGHANISTAN','ALBANIA','ALGERIA','ANDORRA','ANGOLA','ANTIGUA_DEPS','ARGENTINA','ARMENIA','AUSTRALIA','AUSTRIA','AZERBAIJAN','BAHAMAS','BAHRAIN','BANGLADESH','BARBADOS','BELARUS','BELGIUM','BELIZE','BENIN','BHUTAN','BOLIVIA','BOSNIA_HERZEGOVINA','BOTSWANA','BRAZIL','BRUNEI','BULGARIA','BURKINA','BURMA','BURUNDI','CAMBODIA','CAMEROON','CANADA','CAPE_VERDE','CENTRAL_AFRICAN_REP','CHAD','CHILE','CHINA','REPUBLIC_OF_CHINA','COLOMBIA','COMOROS','DEMOCRATIC_REPUBLIC_OF_THE_CONGO','REPUBLIC_OF_THE_CONGO','COSTA_RICA','CROATIA','CUBA','CYPRUS','CZECH_REPUBLIC','DANZIG','DENMARK','DJIBOUTI','DOMINICA','DOMINICAN_REPUBLIC','EAST_TIMOR','ECUADOR','EGYPT','EL_SALVADOR','EQUATORIAL_GUINEA','ERITREA','ESTONIA','ETHIOPIA','FIJI','FINLAND','FRANCE','GABON','GAZA_STRIP','THE_GAMBIA','GEORGIA','GERMANY','GHANA','GREECE','GRENADA','GUATEMALA','GUINEA','GUINEA_BISSAU','GUYANA','HAITI','HOLY_ROMAN_EMPIRE','HONDURAS','HUNGARY','ICELAND','INDIA','INDONESIA','IRAN','IRAQ','REPUBLIC_OF_IRELAND','ISRAEL','ITALY','IVORY_COAST','JAMAICA','JAPAN','JONATHANLAND','JORDAN','KAZAKHSTAN','KENYA','KIRIBATI','NORTH_KOREA','SOUTH_KOREA','KOSOVO','KUWAIT','KYRGYZSTAN','LAOS','LATVIA','LEBANON','LESOTHO','LIBERIA','LIBYA','LIECHTENSTEIN','LITHUANIA','LUXEMBOURG','MACEDONIA','MADAGASCAR','MALAWI','MALAYSIA','MALDIVES','MALI','MALTA','MARSHALL_ISLANDS','MAURITANIA','MAURITIUS','MEXICO','MICRONESIA','MOLDOVA','MONACO','MONGOLIA','MONTENEGRO','MOROCCO','MOUNT_ATHOS','MOZAMBIQUE','NAMIBIA','NAURU','NEPAL','NEWFOUNDLAND','NETHERLANDS','NEW_ZEALAND','NICARAGUA','NIGER','NIGERIA','NORWAY','OMAN','OTTOMAN_EMPIRE','PAKISTAN','PALAU','PALESTINE','PANAMA','PAPUA_NEW_GUINEA','PARAGUAY','PERU','PHILIPPINES','POLAND','PORTUGAL','PRUSSIA','QATAR','ROMANIA','ROME','RUSSIAN_FEDERATION','RWANDA','GRENADINES','SAMOA','SAN_MARINO','SAO_TOME_PRINCIPE','SAUDI_ARABIA','SENEGAL','SERBIA','SEYCHELLES','SIERRA_LEONE','SINGAPORE','SLOVAKIA','SLOVENIA','SOLOMON_ISLANDS','SOMALIA','SOUTH_AFRICA','SPAIN','SRI_LANKA','SUDAN','SURINAME','SWAZILAND','SWEDEN','SWITZERLAND','SYRIA','TAJIKISTAN','TANZANIA','THAILAND','TOGO','TONGA','TRINIDAD_TOBAGO','TUNISIA','TURKEY','TURKMENISTAN','TUVALU','UGANDA','UKRAINE','UNITED_ARAB_EMIRATES','UNITED_KINGDOM','URUGUAY','UZBEKISTAN','VANUATU','VATICAN_CITY','VENEZUELA','VIETNAM','YEMEN','ZAMBIA','ZIMBABWE') DEFAULT NULL,
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
  UNIQUE KEY `client_code_25` (`client_code`),
  UNIQUE KEY `client_code_26` (`client_code`),
  UNIQUE KEY `client_code_27` (`client_code`),
  UNIQUE KEY `client_code_28` (`client_code`),
  UNIQUE KEY `client_code_29` (`client_code`),
  UNIQUE KEY `client_code_30` (`client_code`),
  UNIQUE KEY `client_code_31` (`client_code`),
  UNIQUE KEY `client_code_32` (`client_code`),
  UNIQUE KEY `client_code_33` (`client_code`),
  UNIQUE KEY `client_code_34` (`client_code`),
  UNIQUE KEY `client_code_35` (`client_code`),
  UNIQUE KEY `client_code_36` (`client_code`),
  UNIQUE KEY `client_code_37` (`client_code`),
  UNIQUE KEY `client_code_38` (`client_code`),
  CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.clients : ~2 rows (environ)
INSERT INTO `clients` (`node_id`, `client_code`, `city`, `country`, `client_group`, `address`) VALUES
	(1, 'CLI_1', 'Grenoble', 'FRANCE', NULL, '29 chemin du vieux chêne');

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

-- Listage des données de la table synergy.closure : ~18 rows (environ)
INSERT INTO `closure` (`ancestor_id`, `descendant_id`, `depth`) VALUES
	(1, 1, 0),
	(1, 2, 1),
	(1, 4, 2),
	(1, 5, 3),
	(2, 2, 0),
	(2, 4, 1),
	(2, 5, 2),
	(3, 3, 0),
	(4, 4, 0),
	(4, 5, 1),
	(5, 5, 0);

-- Listage de la structure de table synergy. enums
CREATE TABLE IF NOT EXISTS `enums` (
  `id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.enums : ~0 rows (environ)

-- Listage de la structure de table synergy. files
CREATE TABLE IF NOT EXISTS `files` (
  `node_id` int NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `file_path` varchar(1000) NOT NULL,
  `size` bigint DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `checksum` varchar(64) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL COMMENT 'Pour organiser par type: "general", "photos", "curves", etc.',
  `subcategory` varchar(50) DEFAULT NULL COMMENT 'Pour préciser: "top_view", "heating_curve", etc.',
  `additional_info` json DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  CONSTRAINT `files_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.files : ~0 rows (environ)

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

-- Listage des données de la table synergy.furnaces : ~0 rows (environ)

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
  CONSTRAINT `nodes_ibfk_4` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_5` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_6` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_7` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_8` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_9` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.nodes : ~5 rows (environ)
INSERT INTO `nodes` (`id`, `name`, `path`, `type`, `parent_id`, `created_at`, `modified_at`, `data_status`, `description`) VALUES
	(1, 'CustomIA', '/CustomIA', 'client', NULL, '2025-03-28 14:56:18', '2025-03-28 14:56:23', 'opened', 'Entreprise d\'IA'),
	(2, 'TRQ_2025-03-28', '/CustomIA/TRQ_2025-03-28', 'order', 1, '2025-03-28 14:57:40', '2025-03-28 14:57:48', 'opened', 'demande de monitoring'),
	(3, 'TL4227', '/TL4227', 'steel', NULL, '2025-03-28 15:01:07', '2025-03-28 15:01:07', 'new', NULL),
	(4, 'OMN.311.199 ', '/CustomIA/TRQ_2025-03-28/OMN.311.199 ', 'part', 2, '2025-03-28 15:01:22', '2025-03-28 15:01:26', 'opened', 'test de pièce'),
	(5, 'TRIAL_1', '/CustomIA/TRQ_2025-03-28/OMN.311.199 /TRIAL_1', 'test', 4, '2025-03-28 15:03:23', '2025-03-28 15:03:23', 'new', 'trial test');

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
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.orders : ~2 rows (environ)
INSERT INTO `orders` (`node_id`, `order_number`, `order_date`, `commercial`, `contacts`) VALUES
	(2, 'TRQ_2', '2025-03-28', 'Oscar', '[{"name": "Raphael Ledoux", "email": "rl@gmail.com", "phone": "0636363636"}]');

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

-- Listage des données de la table synergy.parts : ~1 rows (environ)
INSERT INTO `parts` (`node_id`, `designation`, `dimensions`, `specifications`, `steel`) VALUES
	(4, 'InGear', '{"weight": {"unit": "kg", "value": "3.34"}, "circular": {"unit": "inch", "diameterIn": "4", "diameterOut": "5"}, "rectangular": {"unit": "mm", "width": "2", "height": "3", "length": "1"}}', '{"ecd": {"unit": "HV_300", "depthMax": "0.9", "depthMin": "0.6", "hardness": "550"}, "coreHardness": {"max": null, "min": null, "unit": null}, "surfaceHardness": {"max": "780", "min": "680", "unit": "HV_200"}}', 'TL4227');

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

-- Listage des données de la table synergy.steels : ~2 rows (environ)
INSERT INTO `steels` (`node_id`, `grade`, `family`, `standard`, `equivalents`, `chemistery`, `elements`) VALUES
	(3, 'TL4227', 'Stainless_steel', 'EN_10020', '[]', '[]', NULL),
	(12, '20MnCr5', 'Low_alloyed', 'GOST_1050', '[{"steel_id": 17}]', '[{"value": 0.025, "element": "P - Phosphorus", "max_value": null, "min_value": null}, {"value": 0.22, "element": "C - Carbon", "max_value": null, "min_value": null}, {"value": 0.4, "element": "Si - Silicon", "max_value": null, "min_value": null}, {"value": 1.4, "element": "Mn - Manganese", "max_value": null, "min_value": null}, {"value": 0.04, "element": "S - Sulfur", "max_value": null, "min_value": null}, {"value": 1.3, "element": "Cr - Chromium", "max_value": null, "min_value": null}, {"value": 0.4, "element": "Cu - Copper", "max_value": null, "min_value": null}]', NULL),
	(17, '20MC5', 'Low_alloyed', 'EN_10020', '[{"steel_id": 12}]', '[]', NULL);

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

-- Listage des données de la table synergy.tests : ~1 rows (environ)
INSERT INTO `tests` (`node_id`, `test_code`, `test_date`, `status`, `location`, `is_mesured`, `furnace_data`, `load_data`, `recipe_data`, `quench_data`, `results_data`, `mounting_type`, `position_type`, `process_type`) VALUES
	(5, 'TRIAL_5', '2025-03-28', 'planned', 'ECM', NULL, '{"quench_cell": "CTG 21H", "furnace_size": "6-4-4", "furnace_type": "Nano", "heating_cell": "CRV", "cooling_media": "Oil"}', '{"size": {"width": {"unit": null, "value": "2"}, "height": {"unit": null, "value": "3"}, "length": {"unit": null, "value": "1"}}, "weight": {"unit": "kg", "value": "602"}, "comments": null, "part_count": "180", "floor_count": "4"}', '{"preox": {"duration": {"unit": null, "value": null}, "temperature": {"unit": null, "value": null}}, "number": null, "cell_temp": {"unit": null, "value": null}, "wait_time": {"unit": null, "value": null}, "thermal_cycle": null, "wait_pressure": {"unit": null, "value": null}, "chemical_cycle": null, "program_duration": {"unit": null, "value": null}}', '{"gas_quench": {"tolerance": {"max": null, "min": null}, "speed_parameters": null, "pressure_parameters": null}, "oil_quench": {"pressure": null, "tolerance": {"max": null, "min": null}, "temperature": {"unit": null, "value": null}, "dripping_time": {"unit": null, "value": null}, "inerting_delay": {"unit": null, "value": null}, "speed_parameters": null}}', NULL, 'Hanging', 'Vertical', 'Annealing');

-- Listage de la structure de table synergy. units
CREATE TABLE IF NOT EXISTS `units` (
  `id` int NOT NULL AUTO_INCREMENT,
  `length_units` enum('mm','inch') DEFAULT NULL,
  `weight_units` enum('kg','pound') DEFAULT NULL,
  `hardness_units` enum('HC_20','HC_30','HC_45','HC_60','HV_200','HV_300','HV_500') DEFAULT NULL,
  `temperature_units` enum('°C','°F') DEFAULT NULL,
  `time_units` enum('s','min','h') DEFAULT NULL,
  `pressure_units` enum('mbar','N') DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.units : ~0 rows (environ)

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
  UNIQUE KEY `username_23` (`username`),
  UNIQUE KEY `username_24` (`username`),
  UNIQUE KEY `username_25` (`username`),
  UNIQUE KEY `username_26` (`username`),
  UNIQUE KEY `username_27` (`username`),
  UNIQUE KEY `username_28` (`username`),
  UNIQUE KEY `username_29` (`username`),
  UNIQUE KEY `username_30` (`username`),
  UNIQUE KEY `username_31` (`username`),
  UNIQUE KEY `username_32` (`username`),
  UNIQUE KEY `username_33` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.users : ~3 rows (environ)
INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `created_at`) VALUES
	(1, 'Mekki', '$2b$10$I3Zt.UoFcXvpu2NqAXFTp.QE.iVWXJU.9DVdl1c53EgY5Pt8opqXC', 'superuser', '2025-03-25 09:14:21'),
	(2, 'Oscar', '$2b$10$kvmgoOO65CdOli6.vb51g.QRXNHd7JFB6lVdgsuRdvp1BrSRw6fCS', 'user', '2025-03-25 09:22:58'),
	(3, 'Christian', '$2b$10$0tEpiXaV1Bw/ln3h5jqI7eKWf/oh2qqwoxjzKXRCwUBzjyfnZzywq', 'superuser', '2025-03-25 14:31:14');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
