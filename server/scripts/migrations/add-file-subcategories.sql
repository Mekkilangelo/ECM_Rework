-- Script pour ajouter les sous-catégories de fichiers (optionnel)
-- Date: 2026-01-08
-- Description: Ajoute les sous-catégories couramment utilisées
-- NOTE: Les sous-catégories n'ont PAS de contrainte FK, ce script est optionnel

-- Sous-catégories pour furnace_report
INSERT IGNORE INTO ref_file_subcategory (name) VALUES
  ('heating'),
  ('cooling'),
  ('tempering'),
  ('alarms');

-- Sous-catégories pour micrographs (avec pattern result-X-sample-Y)
INSERT IGNORE INTO ref_file_subcategory (name) VALUES
  ('x50'),
  ('x500'),
  ('x1000'),
  ('other');

-- Note: Pour micrographs et control-location, les sous-catégories sont dynamiques
-- et suivent le pattern: 'result-{resultIndex}-sample-{sampleIndex}-{magnification}'
-- Exemple: 'result-0-sample-0-x50'

-- Pour control-location, le pattern est: 'result-{resultIndex}-sample-{sampleIndex}'

-- Afficher les sous-catégories créées
SELECT * FROM ref_file_subcategory ORDER BY name;
