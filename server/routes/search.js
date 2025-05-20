/**
 * Routes pour la fonctionnalité de recherche
 */
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { publicAccess } = require('../middleware/access-control');

// Route de recherche globale (accessible sans authentification)
router.get('/', publicAccess, searchController.search);

// Route de recherche par type d'entité (accessible sans authentification)
router.get('/:entityType', publicAccess, searchController.searchByEntityType);

module.exports = router;