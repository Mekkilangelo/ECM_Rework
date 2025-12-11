-- Migration: Ajout des champs wait_gas et wait_flow à la table recipe_chemical_cycle
-- Date: 2025-12-11
-- Description: Ajout des champs pour gérer le gaz et le débit durant la montée en chauffe (wait time)
-- Base de données: MySQL

-- Ajouter wait_gas si elle n'existe pas
SET @column_exists = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE()
    AND table_name = 'recipe_chemical_cycle' 
    AND column_name = 'wait_gas'
);

SET @sql_add_wait_gas = IF(@column_exists = 0,
    'ALTER TABLE recipe_chemical_cycle ADD COLUMN wait_gas VARCHAR(50) AFTER wait_pressure_value',
    'SELECT "Colonne wait_gas existe déjà" AS message'
);

PREPARE stmt FROM @sql_add_wait_gas;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter wait_flow si elle n'existe pas
SET @column_exists = (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_schema = DATABASE()
    AND table_name = 'recipe_chemical_cycle' 
    AND column_name = 'wait_flow'
);

SET @sql_add_wait_flow = IF(@column_exists = 0,
    'ALTER TABLE recipe_chemical_cycle ADD COLUMN wait_flow VARCHAR(50) AFTER wait_gas',
    'SELECT "Colonne wait_flow existe déjà" AS message'
);

PREPARE stmt FROM @sql_add_wait_flow;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérification
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_schema = DATABASE()
AND table_name = 'recipe_chemical_cycle' 
AND column_name IN ('wait_gas', 'wait_flow')
ORDER BY column_name;

