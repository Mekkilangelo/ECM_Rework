-- Migration pour ajouter les colonnes cell_temp_value et cell_temp_unit à recipe_chemical_cycle
-- Date: 2025-11-20
-- Description: Correction pour permettre la sauvegarde du champ "cell temperature" dans le trial form

-- Ajouter les colonnes manquantes pour la température de cellule
ALTER TABLE recipe_chemical_cycle 
ADD COLUMN cell_temp_value VARCHAR(50) DEFAULT NULL COMMENT 'Valeur de la température de cellule';

ALTER TABLE recipe_chemical_cycle 
ADD COLUMN cell_temp_unit VARCHAR(20) DEFAULT NULL COMMENT 'Unité de la température de cellule',
ADD CONSTRAINT fk_recipe_chemical_cycle_cell_temp_unit 
FOREIGN KEY (cell_temp_unit) REFERENCES ref_units(code) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Vérifier que les colonnes ont été ajoutées
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'recipe_chemical_cycle' 
AND COLUMN_NAME IN ('cell_temp_value', 'cell_temp_unit');

-- Message de confirmation
SELECT 'Migration terminée: colonnes cell_temp_value et cell_temp_unit ajoutées à recipe_chemical_cycle' AS status;