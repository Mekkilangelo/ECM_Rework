const express = require('express');
const router = express.Router();
const enumController = require('../controllers/enumController');
const { publicAccess, readAccess, writeAccess } = require('../middleware/access-control');

// Routes publiques (lecture uniquement)
router.get('/', publicAccess, enumController.getEnumInfo);
router.get('/all', publicAccess, enumController.getAllEnums);
router.get('/table/:tableName', publicAccess, enumController.getEnumsByTable);
router.get('/table/:tableName/column/:columnName', publicAccess, enumController.getEnumValues);

// Routes de lecture protégées
router.get('/usage/:tableName/:columnName/:value', readAccess, enumController.checkEnumValueUsage);

// Routes d'écriture protégées
router.post('/table/:tableName/column/:columnName', writeAccess, enumController.addEnumValue);
router.put('/table/:tableName/column/:columnName', writeAccess, enumController.updateEnumValue);
router.delete('/table/:tableName/column/:columnName', writeAccess, enumController.deleteEnumValue);
router.post('/replace/:tableName/:columnName', writeAccess, enumController.replaceAndDeleteEnumValue);

module.exports = router;