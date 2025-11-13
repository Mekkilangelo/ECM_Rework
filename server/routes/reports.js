/**
 * Routes pour la génération de rapports
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { readAccess } = require('../middleware/access-control');

/**
 * @route GET /api/reports/trials/:trialId
 * @desc Génère les données d'un rapport de trial
 * @access Private (lecture)
 */
router.get('/trials/:trialId', authenticate, readAccess, reportController.getTrialReportData);

module.exports = router;
