-- Script pour ajouter les catégories de fichiers nécessaires
-- Date: 2026-01-08
-- Description: Ajoute toutes les catégories de fichiers utilisées dans l'application

-- Insertion des catégories si elles n'existent pas déjà
INSERT IGNORE INTO ref_file_category (name) VALUES
  ('general'),           -- Catégorie générale par défaut
  ('furnace_report'),    -- Rapports du four (heating, cooling, tempering, alarms)
  ('datapaq'),           -- Fichiers DATAPAQ (NOUVEAU - section autonome)
  ('micrographs'),       -- Micrographies (x50, x500, x1000, other)
  ('micrography'),       -- Normalisation pour micrographies
  ('control-location'),  -- Zones de contrôle
  ('part_documents'),    -- Documents de la pièce
  ('trial_documents');   -- Documents de l'essai

-- Afficher les catégories créées
SELECT * FROM ref_file_category ORDER BY name;
