-- ============================================
-- MIGRATION 001: Ajout storage_key et context au système de fichiers
-- Date: 2025-12-01
-- Objectif: Moderniser le système de gestion de fichiers avec storage_key immuable et contexte JSON
-- ============================================

-- ============================================
-- ÉTAPE 1: Ajouter nouvelles colonnes à la table files
-- ============================================

-- Ajouter storage_key (clé de stockage immuable)
ALTER TABLE files 
ADD COLUMN storage_key VARCHAR(500) NULL AFTER file_path,
ADD INDEX idx_storage_key (storage_key);

-- Ajouter contexte JSON pour métadonnées flexibles
ALTER TABLE files 
ADD COLUMN context JSON NULL AFTER subcategory;

-- Ajouter support versioning (pour évolution future)
ALTER TABLE files 
ADD COLUMN version INT DEFAULT 1 AFTER context,
ADD COLUMN is_latest BOOLEAN DEFAULT TRUE AFTER version,
ADD COLUMN previous_version_id INT NULL AFTER is_latest;

-- Ajouter tracking utilisateur
ALTER TABLE files 
ADD COLUMN uploaded_by INT NULL AFTER previous_version_id,
ADD COLUMN uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER uploaded_by,
ADD COLUMN modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER uploaded_at;

-- Ajouter contrainte utilisateur
ALTER TABLE files 
ADD CONSTRAINT fk_files_uploaded_by 
FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

-- Index sur contexte JSON (pour requêtes performantes)
ALTER TABLE files 
ADD INDEX idx_context_entity_type ((CAST(context->>'$.entity_type' AS CHAR(50)))),
ADD INDEX idx_context_entity_id ((CAST(context->>'$.entity_id' AS UNSIGNED))),
ADD INDEX idx_context_file_type ((CAST(context->>'$.file_type' AS CHAR(50))));

-- ============================================
-- ÉTAPE 2: Créer table file_metadata pour métadonnées extensibles
-- ============================================

CREATE TABLE IF NOT EXISTS file_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_node_id INT NOT NULL,
    meta_key VARCHAR(100) NOT NULL,
    meta_value TEXT,
    meta_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_file_metadata_node 
        FOREIGN KEY (file_node_id) REFERENCES files(node_id) ON DELETE CASCADE,
    UNIQUE KEY unique_file_meta (file_node_id, meta_key),
    INDEX idx_meta_key (meta_key),
    INDEX idx_meta_type (meta_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Métadonnées extensibles pour les fichiers';

-- ============================================
-- ÉTAPE 3: Créer table ref_file_types (système unifié)
-- ============================================

CREATE TABLE IF NOT EXISTS ref_file_types (
    code VARCHAR(50) PRIMARY KEY,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    parent_type VARCHAR(50) NULL,
    entity_type VARCHAR(50) NULL COMMENT 'Type d''entité associée (trial, part, client, etc.)',
    storage_path_template VARCHAR(200) NULL COMMENT 'Template de path: {entity_type}/{entity_id}/{file_type}',
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_ref_file_types_parent 
        FOREIGN KEY (parent_type) REFERENCES ref_file_types(code) ON DELETE SET NULL,
    INDEX idx_entity_type (entity_type),
    INDEX idx_parent_type (parent_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Types de fichiers unifiés avec hiérarchie';

-- ============================================
-- ÉTAPE 4: Peupler ref_file_types
-- ============================================

-- Catégories principales
INSERT INTO ref_file_types (code, label, entity_type, storage_path_template, display_order, description) VALUES
('micrograph', 'Micrographie', 'trial', 'trial/{entity_id}/micrograph', 10, 'Images de micrographie des essais'),
('furnace_report', 'Rapport de four', 'trial', 'trial/{entity_id}/furnace_report', 20, 'Rapports et courbes du four'),
('load_design', 'Plan de charge', 'trial', 'trial/{entity_id}/load_design', 30, 'Plans de chargement des pièces'),
('control_location', 'Emplacements de contrôle', 'trial', 'trial/{entity_id}/control_location', 40, 'Emplacements des points de contrôle'),
('part_photo', 'Photo de pièce', 'part', 'part/{entity_id}/photo', 50, 'Photos des pièces'),
('document', 'Document', 'trial_request', 'trial_request/{entity_id}/document', 60, 'Documents généraux'),
('recipe_photo', 'Photo de recette', 'trial', 'trial/{entity_id}/recipe_photo', 70, 'Photos des courbes de recette'),
('hardness_photo', 'Photo de dureté', 'trial', 'trial/{entity_id}/hardness_photo', 80, 'Photos des résultats de dureté'),
('ecd_photo', 'Photo DCE', 'trial', 'trial/{entity_id}/ecd_photo', 90, 'Photos de la dureté de couche externe')
ON DUPLICATE KEY UPDATE label=VALUES(label), description=VALUES(description);

-- Sous-types de micrographie
INSERT INTO ref_file_types (code, label, parent_type, entity_type, display_order, description) VALUES
('micrograph_x50', 'Micrographie x50', 'micrograph', 'trial', 11, 'Zoom x50'),
('micrograph_x500', 'Micrographie x500', 'micrograph', 'trial', 12, 'Zoom x500'),
('micrograph_x1000', 'Micrographie x1000', 'micrograph', 'trial', 13, 'Zoom x1000'),
('micrograph_other', 'Autre micrographie', 'micrograph', 'trial', 14, 'Autres zooms')
ON DUPLICATE KEY UPDATE label=VALUES(label), description=VALUES(description);

-- Sous-types de photos de pièce
INSERT INTO ref_file_types (code, label, parent_type, entity_type, display_order, description) VALUES
('part_photo_front', 'Photo de face', 'part_photo', 'part', 51, 'Vue de face'),
('part_photo_profile', 'Photo de profil', 'part_photo', 'part', 52, 'Vue de profil'),
('part_photo_quarter', 'Photo de quart', 'part_photo', 'part', 53, 'Vue de quart')
ON DUPLICATE KEY UPDATE label=VALUES(label), description=VALUES(description);

-- Sous-types de rapport de four
INSERT INTO ref_file_types (code, label, parent_type, entity_type, display_order, description) VALUES
('furnace_heating', 'Courbe de chauffage', 'furnace_report', 'trial', 21, 'Courbe de montée en température'),
('furnace_cooling', 'Courbe de refroidissement', 'furnace_report', 'trial', 22, 'Courbe de descente en température'),
('furnace_alarms', 'Alarmes', 'furnace_report', 'trial', 23, 'Journal des alarmes du four'),
('furnace_datapaq', 'Datapaq', 'furnace_report', 'trial', 24, 'Données Datapaq')
ON DUPLICATE KEY UPDATE label=VALUES(label), description=VALUES(description);

-- ============================================
-- ÉTAPE 5: Créer vue de compatibilité pour ancien système
-- ============================================

CREATE OR REPLACE VIEW v_files_legacy AS
SELECT 
    f.node_id,
    f.original_name,
    f.file_path,
    f.storage_key,
    f.size,
    f.mime_type,
    f.checksum,
    -- Mapping vers ancien système
    COALESCE(f.category, f.context->>'$.file_type') AS category,
    COALESCE(f.subcategory, f.context->>'$.file_subtype') AS subcategory,
    f.context,
    f.version,
    f.is_latest,
    f.uploaded_by,
    f.uploaded_at,
    f.modified_at,
    -- Informations du nœud
    n.name,
    n.path,
    n.type,
    n.parent_id,
    n.data_status
FROM files f
INNER JOIN nodes n ON f.node_id = n.id;

-- ============================================
-- VÉRIFICATION
-- ============================================

SELECT '=== Structure de la table files mise à jour ===' as 'Vérification';
SHOW COLUMNS FROM files;

SELECT '=== Table file_metadata créée ===' as 'Vérification';
SHOW COLUMNS FROM file_metadata;

SELECT '=== Table ref_file_types créée ===' as 'Vérification';
SELECT code, label, entity_type, parent_type FROM ref_file_types ORDER BY display_order;

SELECT '=== Vue de compatibilité créée ===' as 'Vérification';
SHOW CREATE VIEW v_files_legacy;

-- ============================================
-- ROLLBACK (si nécessaire)
-- ============================================
-- Pour annuler cette migration, exécuter:
/*
DROP VIEW IF EXISTS v_files_legacy;
DROP TABLE IF EXISTS file_metadata;
DROP TABLE IF EXISTS ref_file_types;

ALTER TABLE files 
DROP FOREIGN KEY IF EXISTS fk_files_uploaded_by,
DROP INDEX IF EXISTS idx_storage_key,
DROP INDEX IF EXISTS idx_context_entity_type,
DROP INDEX IF EXISTS idx_context_entity_id,
DROP INDEX IF EXISTS idx_context_file_type,
DROP COLUMN IF EXISTS storage_key,
DROP COLUMN IF EXISTS context,
DROP COLUMN IF EXISTS version,
DROP COLUMN IF EXISTS is_latest,
DROP COLUMN IF EXISTS previous_version_id,
DROP COLUMN IF EXISTS uploaded_by,
DROP COLUMN IF EXISTS uploaded_at,
DROP COLUMN IF EXISTS modified_at;
*/
