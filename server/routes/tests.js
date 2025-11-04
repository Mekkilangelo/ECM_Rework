const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { publicAccess, writeAccess } = require('../middleware/access-control');

// Routes pour la gestion des tests (lecture uniquement)
router.get('/', publicAccess, testController.getTests);
router.get('/:testId', publicAccess, testController.getTestById);
router.get('/:testId/specs', publicAccess, testController.getTestSpecs);
// Route de rapport déplacée vers /api/reports/tests/:testId (voir routes/reports.js)

// Routes protégées pour la modification (création, mise à jour, suppression)
router.post('/', writeAccess, testController.createTest);
router.put('/:testId', writeAccess, testController.updateTest);
router.delete('/:testId', writeAccess, testController.deleteTest);

module.exports = router;