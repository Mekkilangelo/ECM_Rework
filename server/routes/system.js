/**
 * Routes de gestion du système
 * ==========================
 * 
 * Ce module définit les routes API pour les opérations système critiques,
 * incluant la configuration générale et les paramètres de sécurité.
 * 
 * Points d'accès:
 * - GET /api/system/settings - Récupère les paramètres système
 * - GET /api/system/security - Récupère les informations de sécurité
 * - PUT /api/system/settings/readonly - Active/désactive le mode lecture seule global
 * 
 * Contrôle d'accès:
 * - Les routes GET nécessitent une authentification (readAccess)
 * - La route de modification du mode lecture seule nécessite des droits
 *   de super-administrateur (superUserAccess) pour éviter toute
 *   activation/désactivation non autorisée
 * 
 * Note de sécurité:
 * Ces routes doivent être particulièrement protégées car elles permettent
 * de modifier des paramètres critiques qui affectent l'ensemble du système.
 */

const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { readAccess, superUserAccess } = require('../middleware/access-control');

// Routes d'accès aux paramètres (nécessitent authentification)
router.get('/settings', readAccess, systemController.getSystemSettings);
router.get('/security', readAccess, systemController.getSecurityInfo);

// Routes de modification des paramètres système (super-administrateur uniquement)
router.put('/settings/readonly', superUserAccess, systemController.updateReadOnlyMode);

module.exports = router;
