const express = require('express');
const router = express.Router();
const trialController = require('../controllers/trialController');
const trialSearchController = require('../controllers/trialSearchController');
const { publicAccess, writeAccess } = require('../middleware/access-control');

// Routes de recherche d'essais
router.get('/search', publicAccess, trialSearchController.searchTrials);
router.get('/filter-options', publicAccess, trialSearchController.getFilterOptions);

// Routes pour la gestion des trials (lecture uniquement)
router.get('/', publicAccess, trialController.getTrials);
router.get('/:trialId', publicAccess, trialController.getTrialById);
router.get('/:trialId/specs', publicAccess, trialController.getTrialSpecs);
// Route de rapport déplacée vers /api/reports/trials/:trialId (voir routes/reports.js)

// Routes protégées pour la modification (création, mise à jour, suppression)
router.post('/', writeAccess, trialController.createTrial);
router.put('/:trialId', writeAccess, trialController.updateTrial);
router.delete('/:trialId', writeAccess, trialController.deleteTrial);

module.exports = router;