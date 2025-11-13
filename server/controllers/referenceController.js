/**
 * Controller pour gérer les tables de référence (ref_*)
 * Remplace le système d'ENUM par des tables de référence normalisées
 */

const referenceService = require('../services/referenceService');

/**
 * Récupère la liste de toutes les tables de référence disponibles
 * @route GET /api/references
 */
const getAllTables = async (req, res) => {
  try {
    const tables = referenceService.getAllTables();
    res.status(200).json({
      success: true,
      data: tables
    });
  } catch (error) {
    console.error('Erreur dans getAllTables:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Récupérer toutes les valeurs d'une table de référence
 * @route GET /api/references/:table
 */
const getValues = async (req, res) => {
  try {
    const { table } = req.params;
    
    if (!table) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la table est requis'
      });
    }
    
    const values = await referenceService.getValues(table);
    
    res.status(200).json({
      success: true,
      data: {
        tableName: table,
        values: values
      }
    });
  } catch (error) {
    console.error(`Erreur dans getValues pour ${req.params.table}:`, error);
    
    // Retourner 400 pour les erreurs de validation, 500 pour les autres
    const statusCode = error.message.includes('invalide') || error.message.includes('requis') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Ajoute une nouvelle valeur à une table de référence
 * @route POST /api/references/:table
 * Body: { 
 *   value: "nouvelle_valeur",
 *   unit_type: "length" // optionnel, pour ref_units
 * }
 */
const addValue = async (req, res) => {
  try {
    const { table } = req.params;
    const { value, ...additionalData } = req.body; // Extraire value et le reste
    
    if (!table) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la table est requis'
      });
    }
    
    if (!value) {
      return res.status(400).json({
        success: false,
        message: 'La valeur est requise'
      });
    }
    
    // Passer les données additionnelles au service
    const result = await referenceService.addValue(table, value, additionalData);
    
    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        tableName: table,
        value: result.value
      }
    });
  } catch (error) {
    console.error(`Erreur dans addValue pour ${req.params.table}:`, error);
    
    // Retourner 400 pour les erreurs de validation/duplication, 500 pour les autres
    const statusCode = error.message.includes('existe déjà') || 
                       error.message.includes('invalide') || 
                       error.message.includes('requis') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Supprime une valeur d'une table de référence
 * @route DELETE /api/references/:table/:value
 */
const deleteValue = async (req, res) => {
  try {
    const { table, value } = req.params;
    
    if (!table) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la table est requis'
      });
    }
    
    if (!value) {
      return res.status(400).json({
        success: false,
        message: 'La valeur est requise'
      });
    }
    
    const result = await referenceService.deleteValue(table, value);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error(`Erreur dans deleteValue pour ${req.params.table}/${req.params.value}:`, error);
    
    // Retourner 400 pour les erreurs de validation/utilisation, 404 pour valeur inexistante, 500 pour les autres
    let statusCode = 500;
    if (error.message.includes('n\'existe pas')) {
      statusCode = 404;
    } else if (error.message.includes('utilisée') || 
               error.message.includes('invalide') || 
               error.message.includes('requis')) {
      statusCode = 400;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Vérifie l'utilisation d'une valeur de référence
 * @route GET /api/references/:table/:value/usage
 */
const checkUsage = async (req, res) => {
  try {
    const { table, value } = req.params;
    
    if (!table) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la table est requis'
      });
    }
    
    if (!value) {
      return res.status(400).json({
        success: false,
        message: 'La valeur est requise'
      });
    }
    
    const usage = await referenceService.checkUsage(table, value);
    
    res.status(200).json({
      success: true,
      data: usage
    });
  } catch (error) {
    console.error(`Erreur dans checkUsage pour ${req.params.table}/${req.params.value}:`, error);
    
    const statusCode = error.message.includes('invalide') || error.message.includes('requis') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Remplace une valeur de référence par une autre et supprime l'ancienne
 * @route PUT /api/references/:table/:value/replace
 * Body: { newValue: "nouvelle_valeur" }
 */
const replaceValue = async (req, res) => {
  try {
    const { table, value } = req.params;
    const { newValue } = req.body;
    
    if (!table) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la table est requis'
      });
    }
    
    if (!value || !newValue) {
      return res.status(400).json({
        success: false,
        message: 'L\'ancienne valeur et la nouvelle valeur sont requises'
      });
    }
    
    const result = await referenceService.replaceValue(table, value, newValue);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        tableName: table,
        oldValue: value,
        newValue: newValue,
        updatedCount: result.updatedCount
      }
    });
  } catch (error) {
    console.error(`Erreur dans replaceValue pour ${req.params.table}/${req.params.value}:`, error);
    
    const statusCode = error.message.includes('existe déjà') || 
                       error.message.includes('n\'existe pas') ||
                       error.message.includes('invalide') || 
                       error.message.includes('requis') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Met à jour une valeur de référence et toutes ses utilisations
 * @route PUT /api/references/:table
 * Body: { oldValue: "ancienne_valeur", newValue: "nouvelle_valeur" }
 */
const updateValue = async (req, res) => {
  try {
    const { table } = req.params;
    const { oldValue, newValue } = req.body;
    
    if (!table) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la table est requis'
      });
    }
    
    if (!oldValue || !newValue) {
      return res.status(400).json({
        success: false,
        message: 'L\'ancienne valeur et la nouvelle valeur sont requises'
      });
    }
    
    const result = await referenceService.updateValue(table, oldValue, newValue);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        tableName: table,
        oldValue: result.oldValue,
        newValue: result.newValue,
        updatedReferences: result.updatedReferences
      }
    });
  } catch (error) {
    console.error(`Erreur dans updateValue pour ${req.params.table}:`, error);
    
    const statusCode = error.message.includes('existe déjà') || 
                       error.message.includes('n\'existe pas') ||
                       error.message.includes('invalide') || 
                       error.message.includes('requis') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Remplace une valeur par une autre puis supprime l'ancienne
 * @route POST /api/references/:table/replace
 * Body: { oldValue: "valeur_a_supprimer", replacementValue: "valeur_de_remplacement" }
 */
const replaceAndDelete = async (req, res) => {
  try {
    const { table } = req.params;
    const { oldValue, replacementValue } = req.body;
    
    if (!table) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la table est requis'
      });
    }
    
    if (!oldValue || !replacementValue) {
      return res.status(400).json({
        success: false,
        message: 'L\'ancienne valeur et la valeur de remplacement sont requises'
      });
    }
    
    const result = await referenceService.replaceAndDelete(table, oldValue, replacementValue);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        tableName: table,
        oldValue: result.oldValue,
        replacementValue: result.replacementValue,
        updatedReferences: result.updatedReferences
      }
    });
  } catch (error) {
    console.error(`Erreur dans replaceAndDelete pour ${req.params.table}:`, error);
    
    const statusCode = error.message.includes('n\'existe pas') ||
                       error.message.includes('invalide') || 
                       error.message.includes('requis') ? 400 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Supprimer une valeur en forçant (met les références à NULL)
 * @route DELETE /api/references/:table/:value/force
 */
const forceDelete = async (req, res) => {
  try {
    const { table, value } = req.params;
    
    if (!table) {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la table est requis'
      });
    }
    
    if (!value) {
      return res.status(400).json({
        success: false,
        message: 'La valeur est requise'
      });
    }
    
    const result = await referenceService.forceDelete(table, value);
    
    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        tableName: table,
        value: value,
        updatedCount: result.updatedReferences
      }
    });
  } catch (error) {
    console.error(`Erreur dans forceDelete pour ${req.params.table}/${req.params.value}:`, error);
    
    let statusCode = 500;
    if (error.message.includes('n\'existe pas')) {
      statusCode = 404;
    } else if (error.message.includes('invalide') || error.message.includes('requis')) {
      statusCode = 400;
    }
    
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};


module.exports = {
  getAllTables,
  getValues,
  addValue,
  deleteValue,
  forceDelete,
  checkUsage,
  updateValue,
  replaceValue,
  replaceAndDelete
};

