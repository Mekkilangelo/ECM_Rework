/**
 * Routes de gestion des utilisateurs
 * ================================
 * 
 * Ce module définit les routes API pour la gestion des utilisateurs du système.
 * Il permet de créer, lire, mettre à jour et supprimer des comptes utilisateurs,
 * ainsi que de gérer les rôles et les droits d'accès.
 * 
 * Points d'accès:
 * - GET /api/users/me - Récupère les informations de l'utilisateur connecté
 * - GET /api/users - Récupère tous les utilisateurs (admin seulement)
 * - GET /api/users/:userId - Récupère un utilisateur spécifique (admin seulement)
 * - POST /api/users/first-user - Crée le premier utilisateur (superuser) uniquement si aucun utilisateur n'existe
 * - POST /api/users/register - Crée un nouvel utilisateur (admin/superuser seulement)
 * - PUT /api/users/roles - Met à jour les rôles des utilisateurs (admin seulement)
 * - POST /api/users/:userId/reset-password - Réinitialise le mot de passe (admin seulement)
 * - DELETE /api/users/:userId - Supprime un utilisateur (admin seulement)
 * 
 * Contrôle d'accès:
 * - GET /me est disponible pour tous les utilisateurs authentifiés
 * - Les routes de consultation nécessitent des droits admin (adminAccess)
 * - La route /first-user est la seule non protégée mais elle ne fonctionne que si aucun utilisateur n'existe
 * - Toutes les autres routes de modification nécessitent des droits admin et vérifient
 *   le mode lecture seule global (adminWriteAccess)
 * 
 * Note de sécurité:
 * Ces routes concernent la gestion des utilisateurs et des droits d'accès,
 * elles sont donc particulièrement sensibles et soumises à des contrôles d'accès stricts.
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { readAccess, adminAccess, adminWriteAccess } = require('../middleware/access-control');
const paginationMiddleware = require('../middleware/pagination');

// Middleware de pagination pour les listes
const paginate = paginationMiddleware();

// Route pour l'utilisateur actuel (accessible à tout utilisateur authentifié)
router.get('/me', readAccess, userController.getCurrentUser);

// Routes de consultation des utilisateurs (administrateurs uniquement)
router.get('/', adminAccess, paginate, userController.getUsers);
router.get('/:userId', adminAccess, userController.getUserById);

// Routes de modification des utilisateurs (administrateurs uniquement, vérification mode lecture seule)
router.post('/first-user', userController.createFirstUser);     // Route non protégée uniquement pour le premier utilisateur
router.post('/register', adminWriteAccess, userController.register); // Route protégée pour la page Manage Users
router.post('/:userId/reset-password', adminWriteAccess, userController.resetPassword);
router.put('/roles', adminWriteAccess, userController.updateUsersRoles);
router.delete('/:userId', adminWriteAccess, userController.deleteUser);

module.exports = router;