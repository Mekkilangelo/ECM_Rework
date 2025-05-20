/**
 * Module de contrôle d'accès unifiés
 * ==================================
 * 
 * Ce module fournit des combinaisons standardisées de middlewares pour le contrôle d'accès.
 * Il encapsule les différentes combinaisons de vérifications d'authentification et
 * d'autorisation en patterns réutilisables, garantissant une application cohérente
 * des politiques de sécurité dans toute l'application.
 * 
 * Avantages:
 * - Application uniforme des règles de sécurité
 * - Centralisation des politiques d'accès
 * - Réduction du code dupliqué
 * - Facilité d'évolution des règles d'accès
 * 
 * Usage recommandé:
 * Utiliser ces middlewares combinés plutôt que les middlewares individuels
 * de auth.js directement dans les routes.
 */

const { authenticate, requireEditRights, requireAdmin, requireSuperUser } = require('./auth');
const checkGlobalReadOnly = require('./global-read-only');

/**
 * Middleware d'accès en lecture
 * ===========================
 * 
 * Vérifie uniquement si l'utilisateur est correctement authentifié.
 * Utilisé pour les routes qui nécessitent une authentification mais pas de droits
 * d'édition spécifiques, généralement pour les opérations GET.
 * 
 * Séquence d'exécution:
 * 1. authenticate - Vérifie l'authentification de l'utilisateur
 * 
 * Utilisation typique:
 * router.get('/private-resources', readAccess, resourceController.getResources);
 */
const readAccess = [
  authenticate
];

/**
 * Middleware d'accès public
 * =======================
 * 
 * Aucune vérification d'authentification, utilisé pour les routes publiques.
 * Tableau vide pour maintenir la cohérence d'interface avec les autres middlewares combinés.
 * 
 * Utilisation typique:
 * router.get('/public-resources', publicAccess, resourceController.getPublicResources);
 */
const publicAccess = [];

/**
 * Middleware d'accès en écriture
 * ============================
 * 
 * Combine trois vérifications :
 * 1. authenticate - Vérifie l'authentification de l'utilisateur
 * 2. checkGlobalReadOnly - Vérifie si le système n'est pas en mode lecture seule global
 * 3. requireEditRights - Vérifie si l'utilisateur a les droits d'édition
 */
const writeAccess = [
  authenticate,
  checkGlobalReadOnly,
  requireEditRights
];

/**
 * Middleware d'accès administrateur
 * ===============================
 * 
 * Vérifie l'authentification et les droits d'administration.
 * 
 * Séquence d'exécution:
 * 1. authenticate - Vérifie l'authentification de l'utilisateur
 * 2. requireAdmin - Vérifie si l'utilisateur a des droits d'administration
 * 
 * Note: Ce middleware ne vérifie PAS le mode lecture seule global,
 * ce qui permet aux administrateurs d'accéder aux interfaces
 * d'administration même en mode lecture seule.
 * 
 * Utilisation typique:
 * router.get('/admin/dashboard', adminAccess, adminController.getDashboard);
 */
const adminAccess = [
  authenticate,
  requireAdmin
];

/**
 * Middleware d'accès super-administrateur
 * =====================================
 * 
 * Vérifie l'authentification et les droits de super-administrateur.
 * 
 * Séquence d'exécution:
 * 1. authenticate - Vérifie l'authentification de l'utilisateur
 * 2. requireSuperUser - Vérifie si l'utilisateur est super-administrateur
 * 
 * Note: Ce middleware ne vérifie PAS le mode lecture seule global,
 * ce qui permet aux super-administrateurs d'accéder à leurs interfaces
 * même en mode lecture seule.
 * 
 * Utilisation typique:
 * router.get('/admin/system', superUserAccess, systemController.getSystemSettings);
 */
const superUserAccess = [
  authenticate,
  requireSuperUser
];

/**
 * Middleware d'accès en écriture pour administrateurs
 * =================================================
 * 
 * Combinaison de vérifications pour les opérations administratives de modification.
 * 
 * Séquence d'exécution:
 * 1. authenticate - Vérifie l'authentification de l'utilisateur
 * 2. checkGlobalReadOnly - Vérifie si le système n'est pas en mode lecture seule global
 * 3. requireAdmin - Vérifie si l'utilisateur a des droits d'administration
 * 
 * Utilisation typique:
 * router.post('/admin/users', adminWriteAccess, userController.createUser);
 */
const adminWriteAccess = [
  authenticate,
  checkGlobalReadOnly,
  requireAdmin
];

/**
 * Middleware d'accès en écriture pour super-administrateurs
 * =======================================================
 * 
 * Combinaison de vérifications pour les opérations super-administratives de modification.
 * 
 * Séquence d'exécution:
 * 1. authenticate - Vérifie l'authentification de l'utilisateur
 * 2. checkGlobalReadOnly - Vérifie si le système n'est pas en mode lecture seule global
 * 3. requireSuperUser - Vérifie si l'utilisateur est super-administrateur
 * 
 * Utilisation typique:
 * router.put('/admin/system/settings', superUserWriteAccess, systemController.updateSystemSettings);
 */
const superUserWriteAccess = [
  authenticate,
  checkGlobalReadOnly,
  requireSuperUser
];

module.exports = {
  readAccess,
  writeAccess,
  adminAccess,
  superUserAccess,
  adminWriteAccess,
  superUserWriteAccess,
  publicAccess
};
