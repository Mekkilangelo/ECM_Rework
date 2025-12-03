/**
 * Routes de gestion des aciers
 * ===========================
 * 
 * Ce module définit les routes API pour la gestion des différents types d'aciers.
 * Il permet de créer, lire, mettre à jour et supprimer des fiches d'acier
 * dans le système.
 * 
 * Points d'accès:
 * - GET /api/steels - Récupère tous les aciers
 * - GET /api/steels/grades - Récupère toutes les nuances d'acier
 * - GET /api/steels/:steelId - Récupère un acier spécifique
 * - POST /api/steels - Crée une nouvelle fiche d'acier
 * - PUT /api/steels/:steelId - Met à jour une fiche d'acier existante
 * - DELETE /api/steels/:steelId - Supprime une fiche d'acier
 * 
 * Contrôle d'accès:
 * - Les routes GET sont publiques (accessibles sans authentification)
 * - Les routes POST, PUT, DELETE nécessitent des droits d'écriture (admin/superuser)
 *   et vérifient le mode lecture seule global
 */

const express = require('express');
const router = express.Router();
const steelController = require('../controllers/steelController');
const { writeAccess, publicAccess } = require('../middleware/access-control');

// Routes publiques (accessibles sans authentification)
router.get('/', publicAccess, steelController.getSteels);
router.get('/grades', publicAccess, steelController.getSteelsGrades);
router.get('/:steelId/usage', publicAccess, steelController.checkSteelUsage);
router.get('/:steelId', publicAccess, steelController.getSteelById);

// Routes de modification (nécessitent des droits d'écriture)
router.post('/', writeAccess, steelController.createSteel);
router.put('/:steelId/replace', writeAccess, steelController.replaceSteelAndDelete);
router.put('/:steelId', writeAccess, steelController.updateSteel);
router.delete('/:steelId/force', writeAccess, steelController.forceDeleteSteel);
router.delete('/:steelId', writeAccess, steelController.deleteSteel);

module.exports = router;