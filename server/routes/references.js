const express = require('express');
const router = express.Router();
const referenceController = require('../controllers/referenceController');
const { publicAccess } = require('../middleware/access-control');

/**
 * Routes pour gérer les tables de référence (ref_*)
 * Remplace le système d'ENUM par des tables de référence normalisées
 */

// GET /api/references - Liste toutes les tables de référence disponibles
router.get('/', publicAccess, referenceController.getAllTables);

// GET /api/references/:table - Récupère toutes les valeurs d'une table
router.get('/:table', publicAccess, referenceController.getValues);

// GET /api/references/:table/:value/usage - Vérifie l'utilisation d'une valeur
router.get('/:table/:value/usage', publicAccess, referenceController.checkUsage);

// POST /api/references/:table - Ajoute une nouvelle valeur à une table
router.post('/:table', publicAccess, referenceController.addValue);

// PUT /api/references/:table - Met à jour une valeur et toutes ses références
router.put('/:table', publicAccess, referenceController.updateValue);

// PUT /api/references/:table/:value/replace - Remplace une valeur par une autre puis supprime l'ancienne
router.put('/:table/:value/replace', publicAccess, referenceController.replaceValue);

// POST /api/references/:table/replace - Remplace une valeur par une autre puis supprime l'ancienne
router.post('/:table/replace', publicAccess, referenceController.replaceAndDelete);

// DELETE /api/references/:table/:value/force - Supprime une valeur en forçant (met les références à NULL)
router.delete('/:table/:value/force', publicAccess, referenceController.forceDelete);

// DELETE /api/references/:table/:value - Supprime une valeur d'une table
router.delete('/:table/:value', publicAccess, referenceController.deleteValue);

module.exports = router;

