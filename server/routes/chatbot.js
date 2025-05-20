const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { publicAccess } = require('../middleware/access-control');

/**
 * @route POST /api/chatbot
 * @desc Traite un message du chatbot
 * @access Public
 */
router.post('/', publicAccess, chatbotController.processMessage);

module.exports = router;