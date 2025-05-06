const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

// Route pour l'utilisateur actuel (tous les utilisateurs authentifiés)
router.get('/me', protect, (req, res) => {
  userController.getCurrentUser(req, res);
});

// Route pour enregistrer un utilisateur (accessible aux admins et superusers)
router.post('/register', protect, adminOnly, (req, res) => {
  userController.register(req, res);
});

// Route pour régénérer un mot de passe utilisateur
router.post('/:userId/reset-password', protect, adminOnly, (req, res) => {
  userController.resetPassword(req, res);
});

// Route pour mettre à jour les rôles des utilisateurs
router.put('/roles', protect, adminOnly, (req, res) => {
  userController.updateUsersRoles(req, res);
});

// Routes protégées pour la gestion des utilisateurs (admin et superuser uniquement)
router.get('/', protect, adminOnly, (req, res) => {
  userController.getUsers(req, res);
});

router.delete('/:userId', protect, adminOnly, (req, res) => {
  userController.deleteUser(req, res);
});

router.get('/:userId', protect, adminOnly, (req, res) => {
  userController.getUserById(req, res);
});

module.exports = router;