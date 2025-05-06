/**
 * Routes d'authentification
 */

const express = require('express');
const router = express.Router();
const { login, getMe, refreshUserToken } = require('../controllers/authController');
const { protect, refreshTokenValidator } = require('../middleware/auth');

// Routes d'authentification
router.post('/login', login);
router.get('/me', protect, getMe);

// La route de rafraîchissement utilise maintenant un middleware spécial qui vérifie le token
// mais qui est moins strict sur l'expiration pour permettre son rafraîchissement
router.post('/refresh-token', refreshTokenValidator, refreshUserToken);

module.exports = router;