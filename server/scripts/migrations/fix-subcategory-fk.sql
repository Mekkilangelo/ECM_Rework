-- Fix: Remove FK constraint on files.subcategory
-- Date: 2026-01-08
-- Description: Les sous-catégories doivent être dynamiques (pas de FK nécessaire)
--              Exemple: result-0-sample-0-x1000 pour micrographies

USE synergia;

-- 1. Trouver le nom exact de la contrainte
SELECT
    CONSTRAINT_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    TABLE_SCHEMA = 'synergia'
    AND TABLE_NAME = 'files'
    AND COLUMN_NAME = 'subcategory'
    AND REFERENCED_TABLE_NAME = 'ref_file_subcategory';

-- 2. Supprimer la contrainte FK (remplacer files_ibfk_24 par le nom trouvé ci-dessus si différent)
ALTER TABLE files DROP FOREIGN KEY files_ibfk_24;

-- 3. Vérifier que la contrainte est supprimée
SELECT
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM
    INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE
    TABLE_SCHEMA = 'synergia'
    AND TABLE_NAME = 'files'
    AND COLUMN_NAME = 'subcategory';

-- Si le résultat est vide, c'est bon !

-- Note: La colonne subcategory reste en place, mais sans contrainte FK
-- Elle peut maintenant contenir n'importe quelle valeur dynamique
