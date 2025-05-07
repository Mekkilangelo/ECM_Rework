/**
 * Routes pour la fonctionnalité de recherche
 */
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

// Route de recherche globale
router.get('/', searchController.search);

// Route de recherche par type d'entité
router.get('/:entityType', searchController.searchByEntityType);

module.exports = router;