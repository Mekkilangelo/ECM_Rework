const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { protect, editRightsOnly } = require('../middleware/auth');

// Routes pour la gestion des tests
router.get('/', testController.getTests);
router.get('/:testId', testController.getTestById);
router.get('/:testId/specs', testController.getTestSpecs);

// Protected routes
router.post('/', protect, editRightsOnly, testController.createTest);
router.put('/:testId', protect, editRightsOnly, testController.updateTest);
router.delete('/:testId', protect, editRightsOnly, testController.deleteTest);
router.get('/:testId/report', testController.getTestReportData);

module.exports = router;