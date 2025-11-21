-- Migration: Ajout des colonnes cell_temp_unit et cell_temp_value à recipe_chemical_cycle
-- Date: 2025-11-20
-- Description: Ajoute les colonnes pour stocker la température de cellule dans le cycle chimique

USE ecm_monitoring;

-- Ajouter la colonne cell_temp_unit
ALTER TABLE recipe_chemical_cycle
ADD COLUMN cell_temp_unit VARCHAR(100) NULL AFTER wait_pressure_value,
ADD CONSTRAINT fk_recipe_chemical_cycle_cell_temp_unit 
  FOREIGN KEY (cell_temp_unit) REFERENCES ref_units(name);

-- Ajouter la colonne cell_temp_value
ALTER TABLE recipe_chemical_cycle
ADD COLUMN cell_temp_value VARCHAR(50) NULL AFTER cell_temp_unit;

-- Vérification
SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'ecm_monitoring'
  AND TABLE_NAME = 'recipe_chemical_cycle'
  AND COLUMN_NAME IN ('cell_temp_unit', 'cell_temp_value')
ORDER BY ORDINAL_POSITION;
