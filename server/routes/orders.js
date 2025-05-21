/**
 * Routes de gestion des commandes
 * ==============================
 * 
 * Ce module définit les routes API pour la gestion des commandes.
 * Il permet de créer, lire, mettre à jour et supprimer des commandes
 * dans le système.
 * 
 * Points d'accès:
 * - GET /api/orders - Récupère toutes les commandes
 * - GET /api/orders/:orderId - Récupère une commande spécifique
 * - POST /api/orders - Crée une nouvelle commande
 * - PUT /api/orders/:orderId - Met à jour une commande existante
 * - DELETE /api/orders/:orderId - Supprime une commande
 * 
 * Contrôle d'accès:
 * - Les routes GET sont accessibles par tous les utilisateurs authentifiés
 * - Les routes POST, PUT, DELETE nécessitent des droits d'écriture (admin/superuser)
 *   et vérifient le mode lecture seule global
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { readAccess, writeAccess } = require('../middleware/access-control');
const paginationMiddleware = require('../middleware/pagination');

// Middleware de pagination pour les listes
const paginate = paginationMiddleware();

// Routes de lecture (accessibles à tous les utilisateurs authentifiés)
router.get('/', readAccess, paginate, orderController.getOrders);
router.get('/:orderId', readAccess, orderController.getOrderById);

// Routes de modification (nécessitent des droits d'écriture)
router.post('/', writeAccess, orderController.createOrder);
router.put('/:orderId', writeAccess, orderController.updateOrder);
router.delete('/:orderId', writeAccess, orderController.deleteOrder);

module.exports = router;