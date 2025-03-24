const express = require('express');
const router = express.Router();
const enumController = require('../controllers/enumController');
const { protect } = require('../middleware/auth');

// Route générique pour toutes les opérations d'ENUM
router.get('/', enumController.getEnumInfo);

// Routes spécifiques
router.get('/all', enumController.getAllEnums);
router.get('/table/:tableName', enumController.getEnumsByTable);
// Correction du nom de la méthode
router.get('/table/:tableName/column/:columnName', enumController.getEnumValues);

router.post('/table/:tableName/column/:columnName', protect, enumController.addEnumValue);
router.put('/table/:tableName/column/:columnName', protect, enumController.updateEnumValue);
router.delete('/table/:tableName/column/:columnName', protect, enumController.deleteEnumValue);

module.exports = router;