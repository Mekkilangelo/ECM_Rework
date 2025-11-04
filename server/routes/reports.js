/**
 * Routes pour la génération de rapports
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { readAccess } = require('../middleware/access-control');

/**
 * @route GET /api/reports/tests/:testId
 * @desc Génère les données d'un rapport de test
 * @access Private (lecture)
 */
router.get('/tests/:testId', authenticate, readAccess, reportController.getTestReportData);

module.exports = router;
