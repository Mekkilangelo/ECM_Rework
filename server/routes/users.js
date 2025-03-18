const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

// Routes pour l'authentification
router.post('/login', userController.login);
router.post('/register', userController.register);

// Routes protégées pour la gestion des utilisateurs (admin uniquement)
router.get('/', protect, adminOnly, userController.getUsers);
router.get('/:userId', protect, adminOnly, userController.getUserById);
router.put('/:userId', protect, adminOnly, userController.updateUser);
router.delete('/:userId', protect, adminOnly, userController.deleteUser);

// Route pour l'utilisateur actuel
router.get('/me', protect, userController.getCurrentUser);
router.put('/me', protect, userController.updateCurrentUser);

module.exports = router;