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

-- Listage de la structure de table synergy. enums
CREATE TABLE IF NOT EXISTS `enums` (
  `id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

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

-- Listage de la structure de procédure synergy. GetEnumValues
DELIMITER //
CREATE PROCEDURE `GetEnumValues`(IN p_table_name VARCHAR(255), IN p_column_name VARCHAR(255))
BEGIN
        SELECT COLUMN_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table_name
          AND COLUMN_NAME = p_column_name
          AND DATA_TYPE = 'enum';
      END//
DELIMITER ;

-- Listage de la structure de procédure synergy. GetTableEnums
DELIMITER //
CREATE PROCEDURE `GetTableEnums`(IN table_name VARCHAR(255))
BEGIN
        SELECT 
          COLUMN_NAME as columnName,
          COLUMN_TYPE as enumValues
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name
          AND DATA_TYPE = 'enum';
      END//
DELIMITER ;

-- Listage de la structure de procédure synergy. ListAllEnums
DELIMITER //
CREATE PROCEDURE `ListAllEnums`()
BEGIN
        SELECT 
          TABLE_NAME as tableName,
          COLUMN_NAME as columnName,
          COLUMN_TYPE as columnType
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND DATA_TYPE = 'enum'
        ORDER BY TABLE_NAME, COLUMN_NAME;
      END//
DELIMITER ;

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
  CONSTRAINT `nodes_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

-- Les données exportées n'étaient pas sélectionnées.

-- Listage de la structure de table synergy. users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','user','superuser') NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Les données exportées n'étaient pas sélectionnées.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
