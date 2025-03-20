const db = require('../models');
const EnumModel = db.Enum;

// Récupérer toutes les colonnes ENUM de la base de données
exports.getAllEnums = async (req, res) => {
  try {
    const enums = await EnumModel.getAllEnums();
    res.status(200).json({ success: true, data: enums });
  } catch (error) {
    console.error('Erreur dans le contrôleur getAllEnums:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Récupérer toutes les colonnes ENUM d'une table spécifique
exports.getEnumsByTable = async (req, res) => {
  try {
    const { tableName } = req.params;
    
    if (!tableName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le nom de la table est requis' 
      });
    }
    
    const enums = await EnumModel.getEnumsByTable(tableName);
    
    res.status(200).json({
      success: true,
      data: {
        tableName,
        columns: enums
      }
    });
  } catch (error) {
    console.error('Erreur dans le contrôleur getEnumsByTable:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Récupérer les valeurs d'une colonne ENUM spécifique
exports.getEnumValues = async (req, res) => {
  try {
    const { tableName, columnName } = req.params;
    
    if (!tableName || !columnName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le nom de la table et le nom de la colonne sont requis' 
      });
    }
    
    const result = await EnumModel.getEnumValues(tableName, columnName);
    
    if (result.error) {
      return res.status(404).json({ 
        success: false, 
        message: result.error 
      });
    }
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Erreur dans le contrôleur getEnumValues:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Point d'entrée générique pour récupérer des informations sur les ENUMs
exports.getEnumInfo = async (req, res) => {
  try {
    const { table, column } = req.query;
    
    // Si ni table ni colonne n'est spécifiée, retourner toutes les colonnes ENUM
    if (!table && !column) {
      const allEnums = await EnumModel.getAllEnums();
      return res.status(200).json({ 
        success: true, 
        data: allEnums 
      });
    }
    
    // Si seule la table est spécifiée, retourner toutes les ENUMs de cette table
    if (table && !column) {
      const tableEnums = await EnumModel.getEnumsByTable(table);
      return res.status(200).json({
        success: true,
        data: {
          tableName: table,
          columns: tableEnums
        }
      });
    }
    
    // Si la table et la colonne sont spécifiées, retourner les valeurs de cette ENUM
    if (table && column) {
      const enumValues = await EnumModel.getEnumValues(table, column);
      return res.status(200).json({ 
        success: true, 
        data: enumValues 
      });
    }
    
    // Si seule la colonne est spécifiée, retourner une erreur
    return res.status(400).json({ 
      success: false, 
      message: 'Le nom de la table est requis lorsque le nom de la colonne est spécifié' 
    });
  } catch (error) {
    console.error('Erreur dans le contrôleur getEnumInfo:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};