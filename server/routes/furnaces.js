const express = require('express');
const router = express.Router();
const furnaceController = require('../controllers/furnaceController');
const { publicAccess, writeAccess } = require('../middleware/access-control');

// Routes pour la gestion des fours (lecture uniquement)
router.get('/', publicAccess, furnaceController.getFurnaces);
router.get('/:furnaceId', publicAccess, furnaceController.getFurnaceById);

// Routes protégées pour la modification (création, mise à jour, suppression)
router.post('/', writeAccess, furnaceController.createFurnace);
router.put('/:furnaceId', writeAccess, furnaceController.updateFurnace);
router.delete('/:furnaceId', writeAccess, furnaceController.deleteFurnace);

module.exports = router;