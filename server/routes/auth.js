/**
 * Routes d'authentification
 * =======================
 * 
 * Ce module définit les routes API pour les opérations d'authentification,
 * incluant la connexion, la vérification de session et le rafraîchissement
 * des tokens JWT.
 * 
 * Points d'accès:
 * - POST /api/auth/login - Authentifie un utilisateur et génère un token JWT
 * - GET /api/auth/me - Récupère les informations de l'utilisateur authentifié
 * - POST /api/auth/refresh-token - Rafraîchit un token JWT expiré ou proche de l'expiration
 * 
 * Contrôle d'accès:
 * - La route de login est publique (accessible sans authentification)
 * - La route /me nécessite une authentification valide
 * - La route de rafraîchissement utilise un middleware spécial qui accepte
 *   les tokens légèrement expirés pour permettre leur rafraîchissement
 * 
 * Mécanisme de sécurité:
 * Le système utilise JWT (JSON Web Tokens) avec une vérification de l'inactivité
 * utilisateur pour garantir une sécurité renforcée tout en offrant une bonne
 * expérience utilisateur.
 */

const express = require('express');
const router = express.Router();
const { login, getMe, refreshUserToken } = require('../controllers/authController');
const { readAccess, publicAccess } = require('../middleware/access-control');
const { validateRefreshToken } = require('../middleware/auth');

// Route d'authentification (publique)
router.post('/login', publicAccess, login);

// Route de vérification du profil (authentifiée)
router.get('/me', readAccess, getMe);

// Route de rafraîchissement de token (utilise un validateur spécial)
// Ce middleware accepte les tokens légèrement expirés pour permettre leur renouvellement
router.post('/refresh-token', validateRefreshToken, refreshUserToken);

module.exports = router;