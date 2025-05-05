const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { protect } = require('../middleware/auth');

/**
 * @route POST /api/chatbot
 * @desc Traite un message du chatbot
 * @access Public (ou Private avec auth middleware)
 */
router.post('/', chatbotController.processMessage);

// Si vous souhaitez restreindre l'accès au chatbot aux utilisateurs authentifiés :
// router.post('/', auth, chatbotController.processMessage);

module.exports = router;