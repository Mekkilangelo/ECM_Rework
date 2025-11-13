/**
 * Routes de gestion des demandes d'essai (trial requests)
 * ========================================================
 * 
 * Ce module définit les routes API pour la gestion des demandes d'essai.
 * Il permet de créer, lire, mettre à jour et supprimer des demandes d'essai
 * dans le système.
 * 
 * Points d'accès:
 * - GET /api/trial-requests - Récupère toutes les demandes d'essai
 * - GET /api/trial-requests/:trialRequestId - Récupère une demande d'essai spécifique
 * - POST /api/trial-requests - Crée une nouvelle demande d'essai
 * - PUT /api/trial-requests/:trialRequestId - Met à jour une demande d'essai existante
 * - DELETE /api/trial-requests/:trialRequestId - Supprime une demande d'essai
 * 
 * Contrôle d'accès:
 * - Les routes GET sont accessibles par tous les utilisateurs authentifiés
 * - Les routes POST, PUT, DELETE nécessitent des droits d'écriture (admin/superuser)
 *   et vérifient le mode lecture seule global
 */

const express = require('express');
const router = express.Router();
const trialRequestController = require('../controllers/trialRequestController');
const { readAccess, writeAccess } = require('../middleware/access-control');
const paginationMiddleware = require('../middleware/pagination');

// Middleware de pagination pour les listes
const paginate = paginationMiddleware();

// Routes de lecture (accessibles à tous les utilisateurs authentifiés)
router.get('/', readAccess, paginate, trialRequestController.getTrialRequests);
router.get('/:trialRequestId', readAccess, trialRequestController.getTrialRequestById);

// Routes de modification (nécessitent des droits d'écriture)
router.post('/', writeAccess, trialRequestController.createTrialRequest);
router.put('/:trialRequestId', writeAccess, trialRequestController.updateTrialRequest);
router.delete('/:trialRequestId', writeAccess, trialRequestController.deleteTrialRequest);

module.exports = router;