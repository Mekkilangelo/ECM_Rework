-- Migration pour restaurer les références de fichiers (catégories et sous-catégories)
-- Date: 2025-12-01
-- Objectif: Restaurer les données supprimées des tables ref_file_category et ref_file_subcategory

-- ============================================
-- TABLE: ref_file_category
-- ============================================
-- Cette table contient les catégories principales de fichiers

INSERT INTO ref_file_category (name) VALUES
('control_location'),
('control-location'),
('documents'),
('furnace_report'),
('load_design'),
('micrography'),
('micrographs'),
('photos')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================
-- TABLE: ref_file_subcategory
-- ============================================
-- Cette table contient les sous-catégories de fichiers

-- Sous-catégories pour Documents (Orders)
INSERT INTO ref_file_subcategory (name) VALUES
('all_documents')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Sous-catégories pour Load Design (Tests - Before)
INSERT INTO ref_file_subcategory (name) VALUES
('load_design')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Sous-catégories pour Furnace Report (Tests - After)
INSERT INTO ref_file_subcategory (name) VALUES
('heating'),
('cooling'),
('alarms'),
('datapaq')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Sous-catégories pour Micrographs (Tests - Results)
-- Note: Les catégories micrographs utilisent un format dynamique avec result-X-sample-Y-zoom
-- mais les vues de zoom sont fixes
INSERT INTO ref_file_subcategory (name) VALUES
('x50'),
('x500'),
('x1000'),
('other')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Sous-catégories pour Control Location (Tests - Results)
-- Note: Les sous-catégories utilisent un format dynamique result-X-sample-Y
-- qui sera stocké tel quel car les subcategories ne sont pas des foreign keys strictes

-- Sous-catégories pour Photos (Parts)
INSERT INTO ref_file_subcategory (name) VALUES
('front'),
('profile'),
('quarter')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================
-- VÉRIFICATION
-- ============================================
-- Requêtes pour vérifier l'insertion

SELECT '=== Catégories de fichiers ===' as 'Vérification';
SELECT * FROM ref_file_category ORDER BY name;

SELECT '=== Sous-catégories de fichiers ===' as 'Vérification';
SELECT * FROM ref_file_subcategory ORDER BY name;

-- Compter les entrées
SELECT 
    'ref_file_category' as 'Table',
    COUNT(*) as 'Nombre_entrées'
FROM ref_file_category
UNION ALL
SELECT 
    'ref_file_subcategory' as 'Table',
    COUNT(*) as 'Nombre_entrées'
FROM ref_file_subcategory;
