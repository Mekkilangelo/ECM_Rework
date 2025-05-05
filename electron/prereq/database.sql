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
  UNIQUE KEY `unique_client_code` (`client_code`),
  CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.clients : ~1 rows (environ)
INSERT INTO `clients` (`node_id`, `client_code`, `city`, `country`, `client_group`, `address`) VALUES
	(1, 'CLI_1', 'Gyor', 'HUNGARY', 'Audi AG', 'Győr, Audi Hungária út 1, 9027 Hongrie');

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

-- Listage des données de la table synergy.closure : ~11 rows (environ)
INSERT INTO `closure` (`ancestor_id`, `descendant_id`, `depth`) VALUES
	(1, 1, 0),
	(1, 2, 1),
	(1, 3, 2),
	(1, 4, 3),
	(2, 2, 0),
	(2, 3, 1),
	(2, 4, 2),
	(3, 3, 0),
	(3, 4, 1),
	(4, 4, 0),
	(18, 18, 0);

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

-- Listage des données de la table synergy.files : ~13 rows (environ)
INSERT INTO `files` (`node_id`, `original_name`, `file_path`, `size`, `mime_type`, `checksum`, `category`, `subcategory`, `additional_info`) VALUES
	(6, 'chauffe.JPG', 'C:\\Users\\mekki\\Desktop\\CIA\\ECM\\Monitoring\\Rework\\server\\uploads\\Audi\\TRQ_2011-02-11\\Shaft\\TRIAL_1\\furnace_report\\heating\\f5f7c485-9844-4173-809f-ccc798b0d13e.JPG', 104939, 'image/jpeg', NULL, 'furnace_report', 'heating', '{"temp_id": null, "upload_date": "2025-04-11T14:45:22.787Z"}'),
	(7, 'trempe.JPG', 'C:\\Users\\mekki\\Desktop\\CIA\\ECM\\Monitoring\\Rework\\server\\uploads\\Audi\\TRQ_2011-02-11\\Shaft\\TRIAL_1\\furnace_report\\cooling\\67d1e280-6d32-4242-ad7a-c89d59612d54.JPG', 102086, 'image/jpeg', NULL, 'furnace_report', 'cooling', '{"temp_id": null, "upload_date": "2025-04-11T14:45:33.945Z"}'),
	(8, 'Portefeuille de competence.pdf', 'C:\\Users\\mekki\\Desktop\\CIA\\ECM\\Monitoring\\Rework\\server\\uploads\\temp\\551d674e-bc05-4386-890a-d9873a67c188.pdf', 1325354, 'application/pdf', NULL, 'documents', 'all_documents', '{"temp_id": "temp-09e02b85-edda-413a-8e3c-20c0d38987e2", "upload_date": "2025-04-14T08:52:38.381Z"}'),
	(15, 'PA290063.JPG', 'C:\\Users\\mekki\\Desktop\\CIA\\ECM\\Monitoring\\Rework\\server\\uploads\\Audi\\TRQ_2011-02-11\\Shaft\\photos\\front\\da2a1732-7933-40f9-82aa-c5ff03569861.JPG', 794133, 'image/jpeg', NULL, 'photos', 'front', '{"temp_id": null, "upload_date": "2025-04-14T14:03:14.870Z"}'),
	(16, 'PA290060.JPG', 'C:\\Users\\mekki\\Desktop\\CIA\\ECM\\Monitoring\\Rework\\server\\uploads\\Audi\\TRQ_2011-02-11\\Shaft\\photos\\front\\3cf04748-c1b0-4b74-acb4-c35221784d44.JPG', 873104, 'image/jpeg', NULL, 'photos', 'front', '{"temp_id": null, "upload_date": "2025-04-14T14:03:14.880Z"}'),
	(17, 'PA290059.JPG', 'C:\\Users\\mekki\\Desktop\\CIA\\ECM\\Monitoring\\Rework\\server\\uploads\\Audi\\TRQ_2011-02-11\\Shaft\\photos\\profile\\222a4c78-59aa-4cc5-bf6f-cf0ecf161eec.JPG', 944608, 'image/jpeg', NULL, 'photos', 'profile', '{"temp_id": null, "upload_date": "2025-04-14T14:03:16.471Z"}'),
	(19, 'Cycle TTH.png', 'C:\\Users\\mekki\\Desktop\\CIA\\ECM\\Monitoring\\Rework\\server\\uploads\\Audi\\TRQ_2011-02-11\\Shaft\\TRIAL_1\\recipe_graph\\recipe_graph\\8f550c0b-6e29-408d-b1b1-19e9c5478374.png', 18885, 'image/png', NULL, 'recipe_graph', 'recipe_graph', '{"temp_id": null, "upload_date": "2025-04-14T14:13:03.156Z"}'),
	(29, 'IMG_3664.JPG', 'C:\\Users\\mekki\\Desktop\\CIA\\ECM\\Monitoring\\Rework\\server\\uploads\\Audi\\TRQ_2011-02-11\\Shaft\\TRIAL_1\\load_design\\load_design\\2cb30068-ae9b-44db-90d7-d1bd43561f5e.JPG', 2310237, 'image/jpeg', NULL, 'load_design', 'load_design', '{"temp_id": null, "upload_date": "2025-04-14T14:14:22.934Z"}'),
	(30, 'IMG_3670.JPG', 'C:\\Users\\mekki\\Desktop\\CIA\\ECM\\Monitoring\\Rework\\server\\uploads\\Audi\\TRQ_2011-02-11\\Shaft\\TRIAL_1\\load_design\\load_design\\15c1e6f3-9399-4b85-999a-44fdacb5b1b3.JPG', 2217255, 'image/jpeg', NULL, 'load_design', 'load_design', '{"temp_id": null, "upload_date": "2025-04-14T14:14:37.512Z"}'),
	(32, 'IMG_3654.JPG', 'C:\\Users\\mekki\\Desktop\\CIA\\ECM\\Monitoring\\Rework\\server\\uploads\\Audi\\TRQ_2011-02-11\\Shaft\\TRIAL_1\\load_design\\load_design\\5067e6b6-8466-40ce-be96-fe01618254ff.JPG', 2139732, 'image/jpeg', NULL, 'load_design', 'load_design', '{"temp_id": null, "upload_date": "2025-04-14T14:14:37.527Z"}'),
	(35, 'AUDI - 201120003 - Bottom #115 - Tip x50.JPG', 'C:\\Users\\mekki\\Desktop\\CIA\\ECM\\Monitoring\\Rework\\server\\uploads\\Audi\\TRQ_2011-02-11\\Shaft\\TRIAL_1\\micrographs-result-0\\x50\\9af0aaed-c5e4-4533-8a78-1d47a020d491.JPG', 145778, 'image/jpeg', NULL, 'micrographs-result-0', 'x50', '{"temp_id": null, "upload_date": "2025-04-14T14:18:14.151Z"}'),
	(38, 'AUDI - 201120003 - Bottom #115 - Root x500.JPG', 'C:\\Users\\mekki\\Desktop\\CIA\\ECM\\Monitoring\\Rework\\server\\uploads\\Audi\\TRQ_2011-02-11\\Shaft\\TRIAL_1\\micrographs-result-0\\x500\\2feb9054-58bc-43f9-97ed-c48d0632511e.JPG', 182824, 'image/jpeg', NULL, 'micrographs-result-0', 'x500', '{"temp_id": null, "upload_date": "2025-04-14T14:18:55.757Z"}'),
	(42, 'AUDI - 201120003 - Bottom #115 - Flank x1000.JPG', 'C:\\Users\\mekki\\Desktop\\CIA\\ECM\\Monitoring\\Rework\\server\\uploads\\Audi\\TRQ_2011-02-11\\Shaft\\TRIAL_1\\micrographs-result-0\\x1000\\bb43cdff-4ef2-45d5-b555-a1d5f0a97df8.JPG', 175155, 'image/jpeg', NULL, 'micrographs-result-0', 'x1000', '{"temp_id": null, "upload_date": "2025-04-14T14:19:09.338Z"}');

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
  KEY `idx_parent_id` (`parent_id`),
  CONSTRAINT `nodes_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_10` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_100` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_101` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_102` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_103` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_104` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_105` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_106` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_107` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_108` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_109` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_11` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_110` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_111` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_112` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_113` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
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
  CONSTRAINT `nodes_ibfk_64` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_65` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_66` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_67` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_68` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_69` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_7` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_70` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_71` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_72` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_73` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_74` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_75` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_76` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_77` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_78` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_79` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_8` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_80` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_81` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_82` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_83` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_84` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_85` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_86` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_87` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_88` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_89` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_9` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_90` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_91` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_92` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_93` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_94` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_95` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_96` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_97` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_98` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `nodes_ibfk_99` FOREIGN KEY (`parent_id`) REFERENCES `nodes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.nodes : ~18 rows (environ)
INSERT INTO `nodes` (`id`, `name`, `path`, `type`, `parent_id`, `created_at`, `modified_at`, `data_status`, `description`) VALUES
	(1, 'Audi', '/Audi', 'client', NULL, '2025-04-11 13:08:36', '2025-04-11 13:08:38', 'opened', ''),
	(2, 'TRQ_2011-02-11', '/Audi/TRQ_2011-02-11', 'order', 1, '2025-04-11 13:12:32', '2025-04-14 14:05:22', 'opened', 'Commande de 50 pièce de type Shafts'),
	(3, 'Shaft', '/Audi/TRQ_2011-02-11/Shaft', 'part', 2, '2025-04-11 13:20:42', '2025-04-14 14:04:55', 'opened', '20 pièces reçues emballées'),
	(4, 'TRIAL_1', '/Audi/TRQ_2011-02-11/Shaft/TRIAL_1', 'test', 3, '2025-04-11 13:41:59', '2025-04-15 20:47:40', 'opened', NULL),
	(6, 'chauffe.JPG', '/Audi/TRQ_2011-02-11/Shaft/TRIAL_1/furnace_report/heating/chauffe.JPG', 'file', 4, '2025-04-11 14:45:22', NULL, 'new', 'File uploaded as furnace_report/heating'),
	(7, 'trempe.JPG', '/Audi/TRQ_2011-02-11/Shaft/TRIAL_1/furnace_report/cooling/trempe.JPG', 'file', 4, '2025-04-11 14:45:33', NULL, 'new', 'File uploaded as furnace_report/cooling'),
	(8, 'Portefeuille de competence.pdf', '/temp/temp-09e02b85-edda-413a-8e3c-20c0d38987e2/551d674e-bc05-4386-890a-d9873a67c188.pdf', 'file', NULL, '2025-04-14 08:52:38', NULL, 'new', 'File uploaded as documents/all_documents'),
	(15, 'PA290063.JPG', '/Audi/TRQ_2011-02-11/Shaft/photos/front/PA290063.JPG', 'file', 3, '2025-04-14 14:03:14', NULL, 'new', 'File uploaded as photos/front'),
	(16, 'PA290060.JPG', '/Audi/TRQ_2011-02-11/Shaft/photos/front/PA290060.JPG', 'file', 3, '2025-04-14 14:03:14', NULL, 'new', 'File uploaded as photos/front'),
	(17, 'PA290059.JPG', '/Audi/TRQ_2011-02-11/Shaft/photos/profile/PA290059.JPG', 'file', 3, '2025-04-14 14:03:16', NULL, 'new', 'File uploaded as photos/profile'),
	(18, 'TL4227', '/TL4227', 'steel', NULL, '2025-04-14 14:04:46', '2025-04-14 14:04:46', 'new', NULL),
	(19, 'Cycle TTH.png', '/Audi/TRQ_2011-02-11/Shaft/TRIAL_1/recipe_graph/recipe_graph/Cycle TTH.png', 'file', 4, '2025-04-14 14:13:03', NULL, 'new', 'File uploaded as recipe_graph/recipe_graph'),
	(29, 'IMG_3664.JPG', '/Audi/TRQ_2011-02-11/Shaft/TRIAL_1/load_design/load_design/IMG_3664.JPG', 'file', 4, '2025-04-14 14:14:22', NULL, 'new', 'File uploaded as load_design/load_design'),
	(30, 'IMG_3670.JPG', '/Audi/TRQ_2011-02-11/Shaft/TRIAL_1/load_design/load_design/IMG_3670.JPG', 'file', 4, '2025-04-14 14:14:37', NULL, 'new', 'File uploaded as load_design/load_design'),
	(32, 'IMG_3654.JPG', '/Audi/TRQ_2011-02-11/Shaft/TRIAL_1/load_design/load_design/IMG_3654.JPG', 'file', 4, '2025-04-14 14:14:37', NULL, 'new', 'File uploaded as load_design/load_design'),
	(35, 'AUDI - 201120003 - Bottom #115 - Tip x50.JPG', '/Audi/TRQ_2011-02-11/Shaft/TRIAL_1/micrographs-result-0/x50/AUDI - 201120003 - Bottom #115 - Tip x50.JPG', 'file', 4, '2025-04-14 14:18:14', NULL, 'new', 'File uploaded as micrographs-result-0/x50'),
	(38, 'AUDI - 201120003 - Bottom #115 - Root x500.JPG', '/Audi/TRQ_2011-02-11/Shaft/TRIAL_1/micrographs-result-0/x500/AUDI - 201120003 - Bottom #115 - Root x500.JPG', 'file', 4, '2025-04-14 14:18:55', NULL, 'new', 'File uploaded as micrographs-result-0/x500'),
	(42, 'AUDI - 201120003 - Bottom #115 - Flank x1000.JPG', '/Audi/TRQ_2011-02-11/Shaft/TRIAL_1/micrographs-result-0/x1000/AUDI - 201120003 - Bottom #115 - Flank x1000.JPG', 'file', 4, '2025-04-14 14:19:09', NULL, 'new', 'File uploaded as micrographs-result-0/x1000');

-- Listage de la structure de table synergy. orders
CREATE TABLE IF NOT EXISTS `orders` (
  `node_id` int NOT NULL,
  `order_number` varchar(50) DEFAULT NULL,
  `order_date` date DEFAULT NULL,
  `commercial` varchar(50) DEFAULT NULL,
  `contacts` json DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  UNIQUE KEY `unique_order_number` (`order_number`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.orders : ~1 rows (environ)
INSERT INTO `orders` (`node_id`, `order_number`, `order_date`, `commercial`, `contacts`) VALUES
	(2, 'TRQ_2', '2011-02-11', 'Oscar Pellissier', '[{"name": "", "email": "", "phone": "+36 96 661 210"}]');

-- Listage de la structure de table synergy. parts
CREATE TABLE IF NOT EXISTS `parts` (
  `node_id` int NOT NULL,
  `designation` enum('InGear','OutGear','Ring','Shaft','Gear','Other','Test') DEFAULT NULL,
  `client_designation` varchar(255) DEFAULT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `dimensions` json DEFAULT NULL,
  `specifications` json DEFAULT NULL,
  `steel` varchar(255) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  CONSTRAINT `parts_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.parts : ~1 rows (environ)
INSERT INTO `parts` (`node_id`, `designation`, `client_designation`, `reference`, `dimensions`, `specifications`, `steel`, `quantity`) VALUES
	(3, 'Shaft', 'Shaft', 'OML.311.199', '{"weight": {"unit": "g", "value": "3047"}, "circular": {"unit": "mm", "diameterIn": null, "diameterOut": "85"}, "rectangular": {"unit": "mm", "width": "163", "height": null, "length": null}}', '{"ecd": {"unit": "HV0.5", "depthMax": "0.9", "depthMin": "0.6", "hardness": "550"}, "coreHardness": {"max": null, "min": null, "unit": null}, "surfaceHardness": {"max": "780", "min": "680", "unit": "HV10"}}', 'TL4227', 6);

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

-- Listage des données de la table synergy.steels : ~1 rows (environ)
INSERT INTO `steels` (`node_id`, `grade`, `family`, `standard`, `equivalents`, `chemistery`, `elements`) VALUES
	(18, 'TL4227', 'HCC', 'ASTM_AISI', '[]', '[]', NULL);

-- Listage de la structure de table synergy. tests
CREATE TABLE IF NOT EXISTS `tests` (
  `node_id` int NOT NULL,
  `test_code` varchar(50) DEFAULT NULL,
  `test_date` date DEFAULT NULL,
  `status` enum('OK','NOK','Pending') DEFAULT NULL,
  `location` enum('ECM','Client site') DEFAULT NULL,
  `furnace_data` json DEFAULT NULL,
  `load_data` json DEFAULT NULL,
  `recipe_data` json DEFAULT NULL,
  `quench_data` json DEFAULT NULL,
  `results_data` json DEFAULT NULL,
  `mounting_type` enum('Support_Rack','Hanging','Fixture','Tray','Conveyor_Belt') DEFAULT NULL,
  `position_type` enum('Horizontal','Vertical','Rotary','Stationary','Oscillating') DEFAULT NULL,
  `process_type` enum('Annealing','Quenching','Tempering','Carburizing','Nitriding') DEFAULT NULL,
  `load_number` varchar(50) DEFAULT NULL,
  `preox_media` enum('Water','Air','N2') DEFAULT NULL,
  PRIMARY KEY (`node_id`),
  CONSTRAINT `tests_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.tests : ~1 rows (environ)
INSERT INTO `tests` (`node_id`, `test_code`, `test_date`, `status`, `location`, `furnace_data`, `load_data`, `recipe_data`, `quench_data`, `results_data`, `mounting_type`, `position_type`, `process_type`, `load_number`, `preox_media`) VALUES
	(4, 'TRIAL_4', '2020-11-20', 'OK', 'ECM', '{"quench_cell": null, "furnace_size": null, "furnace_type": null, "heating_cell": null, "cooling_media": null}', '{"size": {"width": {"unit": null, "value": null}, "height": {"unit": null, "value": null}, "length": {"unit": null, "value": null}}, "weight": {"unit": "g", "value": "602000"}, "comments": null, "part_count": "180", "floor_count": null}', '{"preox": {"media": null, "duration": {"unit": null, "value": null}, "temperature": {"unit": null, "value": null}}, "number": "1114", "cell_temp": {"unit": "°C", "value": "980"}, "wait_time": {"unit": "min", "value": "120"}, "selected_gas1": "C2H2", "selected_gas2": "N2", "selected_gas3": null, "thermal_cycle": [{"ramp": "up", "step": 1, "duration": "118", "setpoint": "980"}, {"ramp": "continue", "step": 2, "duration": "65", "setpoint": "980"}, {"ramp": "down", "step": 3, "duration": "74", "setpoint": "850"}], "wait_pressure": {"unit": "mbar", "value": "10"}, "chemical_cycle": [{"step": 1, "time": "295", "gases": [{"gas": "C2H2", "debit": "2500"}], "turbine": false, "pressure": "10"}, {"step": 2, "time": "167", "gases": [{"gas": "C2H2", "debit": "0"}, {"gas": "N2", "debit": "1500"}], "turbine": false, "pressure": "10"}, {"step": 3, "time": "101", "gases": [{"gas": "C2H2", "debit": "2500"}], "turbine": false, "pressure": "10"}, {"step": 4, "time": "247", "gases": [{"gas": "C2H2", "debit": "0"}, {"gas": "N2", "debit": "1500"}], "turbine": false, "pressure": "10"}, {"step": 5, "time": "91", "gases": [{"gas": "C2H2", "debit": "2500"}, {"gas": "N2", "debit": "1500"}], "turbine": false, "pressure": "10"}, {"step": 6, "time": "323", "gases": [{"gas": "C2H2", "debit": "0"}, {"gas": "N2", "debit": "1500"}], "turbine": false, "pressure": "10"}, {"step": 7, "time": "2676", "gases": [{"gas": "C2H2", "debit": "0"}, {"gas": "N2", "debit": "1500"}], "turbine": false, "pressure": "10"}, {"step": 8, "time": "60", "gases": [{"gas": "C2H2", "debit": "0"}, {"gas": "N2", "debit": "1500"}], "turbine": false, "pressure": "10"}, {"step": 9, "time": "4440", "gases": [{"gas": "C2H2", "debit": "0"}, {"gas": "N2", "debit": "1500"}], "turbine": false, "pressure": "10"}], "program_duration": {"unit": "min", "value": "260"}}', '{"gas_quench": {"speed_parameters": null, "pressure_parameters": null}, "oil_quench": {"pressure": null, "temperature": {"unit": "°C", "value": "80"}, "dripping_time": {"unit": null, "value": null}, "inerting_delay": {"unit": "s", "value": "420"}, "speed_parameters": [{"step": 1, "speed": null, "duration": "420"}]}}', '{"results": [{"ecd": {"tooth_root": {"unit": null, "distance": "0.71"}, "tooth_flank": {"unit": null, "distance": "0.83"}, "hardness_unit": "HV0.5", "hardness_value": "550"}, "step": 1, "comment": null, "curve_data": {"points": [{"distance": "0.05", "root_hardness": "691.5650571", "flank_hardness": "710.4253051"}, {"distance": "0.1", "root_hardness": "684.2867773", "flank_hardness": "712.4318404"}, {"distance": "0.20", "root_hardness": "697.226403903799", "flank_hardness": "697.2264039"}, {"distance": "0.30", "root_hardness": "648.0098526", "flank_hardness": "693.5994646"}, {"distance": "0.40", "root_hardness": "636.4100287", "flank_hardness": "680.8645631"}, {"distance": "0.50", "root_hardness": "616.0074571", "flank_hardness": "648.0098526"}, {"distance": "0.60", "root_hardness": "572.2055072", "flank_hardness": "625.3638236"}, {"distance": "0.70", "root_hardness": "552.036096", "flank_hardness": "590.6515011"}, {"distance": "0.80", "root_hardness": "511.2882411", "flank_hardness": "560.0465612"}, {"distance": "0.90", "root_hardness": "496.494435", "flank_hardness": "524.3938189"}, {"distance": "1.00", "root_hardness": "468.6904616", "flank_hardness": "498.8642038"}, {"distance": "1.10", "root_hardness": "465.6258089", "flank_hardness": "483.3931869"}]}, "description": "Bottom of the load -  Front Left ", "hardness_unit": null, "hardness_points": [{"unit": "HV30", "value": "462", "location": "pdd"}]}, {"ecd": {"tooth_root": {"unit": null, "distance": "0.70"}, "tooth_flank": {"unit": null, "distance": "0.83"}, "hardness_unit": "HV_500", "hardness_value": "550"}, "step": 2, "comment": null, "curve_data": {"points": [{"distance": "0.05", "root_hardness": "686.2891298", "flank_hardness": "711.0272287"}, {"distance": "0.10", "root_hardness": "675.4095157", "flank_hardness": "708.0880458"}, {"distance": "0.20", "root_hardness": "673.7198706", "flank_hardness": "706.8480779"}, {"distance": "0.30", "root_hardness": "658.1742455", "flank_hardness": "699.1772424"}, {"distance": "0.40", "root_hardness": "640.644056", "flank_hardness": "686.3595474"}, {"distance": "0.50", "root_hardness": "603.8844966", "flank_hardness": "651.3823648"}, {"distance": "0.60", "root_hardness": "570.5356593", "flank_hardness": "614.5132369"}, {"distance": "0.70", "root_hardness": "534.3417751", "flank_hardness": "592.1159141"}, {"distance": "0.80", "root_hardness": "486.6363643", "flank_hardness": "558.699424"}, {"distance": "0.90", "root_hardness": "461.1687493", "flank_hardness": "513.6736401"}, {"distance": "1.00", "root_hardness": "434.460247", "flank_hardness": "490.9733975"}, {"distance": "1.10", "root_hardness": "426.4786387", "flank_hardness": "477.0055725"}, {"distance": "1.20", "root_hardness": "422.5512758", "flank_hardness": "466.6703319"}]}, "description": "Bottom of the load - Back Left ", "hardness_unit": null, "hardness_points": [{"unit": "HV_300", "value": "449", "location": "pdd"}]}]}', 'Support_Rack', 'Horizontal', 'Tempering', '201120003', NULL);

-- Listage de la structure de table synergy. units
CREATE TABLE IF NOT EXISTS `units` (
  `id` int NOT NULL AUTO_INCREMENT,
  `length_units` enum('mm','inch') DEFAULT NULL,
  `weight_units` enum('g','pound') DEFAULT NULL,
  `hardness_units` enum('HC_20','HC_30','HC_45','HC_60','HV_200','HV_300','HV_500','HV_0.5','HV_30','HV10','HV30','HV0.5') DEFAULT NULL,
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
  UNIQUE KEY `unique_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Listage des données de la table synergy.users : ~4 rows (environ)
INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `created_at`) VALUES
	(1, 'Mekki', '$2b$10$I3Zt.UoFcXvpu2NqAXFTp.QE.iVWXJU.9DVdl1c53EgY5Pt8opqXC', 'superuser', '2025-03-25 09:14:21'),
	(2, 'Oscar', '$2b$10$kvmgoOO65CdOli6.vb51g.QRXNHd7JFB6lVdgsuRdvp1BrSRw6fCS', 'superuser', '2025-03-25 09:22:58'),
	(3, 'Christian', '$2b$10$0tEpiXaV1Bw/ln3h5jqI7eKWf/oh2qqwoxjzKXRCwUBzjyfnZzywq', 'superuser', '2025-03-25 14:31:14'),
	(4, 'Raph', '$2b$10$/0IevvJCCVcn.8IUO7XgQuqaMwFXfbqo7NKVcQ0bRqq2q9afBOgIS', 'admin', '2025-04-03 10:41:13');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
