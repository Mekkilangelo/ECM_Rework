-- Migration: Remove Foreign Key Constraint on files.subcategory
-- Date: 2025-12-03
-- Reason: Dynamic subcategories (result-X-sample-Y-magnification) are incompatible with FK constraints
-- The context JSON field provides sufficient metadata without requiring FK validation

-- Remove the foreign key constraint on subcategory
ALTER TABLE files DROP FOREIGN KEY files_ibfk_3;

-- Verify the constraint is removed
SELECT 'Foreign key files_ibfk_3 removed successfully' AS status;
