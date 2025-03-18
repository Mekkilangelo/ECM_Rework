const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { protect } = require('../middleware/auth');

// Routes pour la gestion des tests
router.get('/', testController.getTests);
router.get('/:testId', testController.getTestById);

// Protected routes
router.post('/', protect, testController.createTest);
router.put('/:testId', protect, testController.updateTest);
router.delete('/:testId', protect, testController.deleteTest);

module.exports = router;