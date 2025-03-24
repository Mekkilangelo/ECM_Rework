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

// Ajouter une nouvelle valeur à une colonne ENUM
exports.addEnumValue = async (req, res) => {
  try {
    const { tableName, columnName } = req.params;
    const { value } = req.body;
    
    if (!tableName || !columnName || !value) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le nom de la table, le nom de la colonne et la valeur sont requis' 
      });
    }
    
    // 1. Récupérer les valeurs actuelles de l'enum
    const currentEnum = await EnumModel.getEnumValues(tableName, columnName);
    
    if (currentEnum.error) {
      return res.status(404).json({ 
        success: false, 
        message: currentEnum.error 
      });
    }
    
    // 2. Vérifier si la valeur existe déjà
    if (currentEnum.values.includes(value)) {
      return res.status(400).json({ 
        success: false, 
        message: `La valeur ${value} existe déjà dans ${tableName}.${columnName}` 
      });
    }
    
    // 3. Ajouter la nouvelle valeur à la liste
    const newValues = [...currentEnum.values, value];
    
    // 4. Construire la requête SQL pour modifier la colonne ENUM
    const enumDefinition = newValues.map(val => `'${val.replace(/'/g, "''")}'`).join(',');
    const query = `ALTER TABLE ${tableName} MODIFY COLUMN ${columnName} ENUM(${enumDefinition})`;
    
    // 5. Exécuter la requête avec Sequelize
    await db.sequelize.query(query);
    
    res.status(200).json({ 
      success: true, 
      message: `Value ${value} added to ${tableName}.${columnName} successfully`,
      data: {
        tableName,
        columnName,
        values: newValues
      }
    });
  } catch (error) {
    console.error('Erreur dans le contrôleur addEnumValue:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Mettre à jour une valeur d'une colonne ENUM
exports.updateEnumValue = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { tableName, columnName } = req.params;
    const { oldValue, newValue } = req.body;
    
    if (!tableName || !columnName || !oldValue || !newValue) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le nom de la table, le nom de la colonne, l\'ancienne valeur et la nouvelle valeur sont requis' 
      });
    }
    
    // 1. Récupérer les valeurs actuelles de l'enum
    const currentEnum = await EnumModel.getEnumValues(tableName, columnName);
    
    if (currentEnum.error) {
      return res.status(404).json({ 
        success: false, 
        message: currentEnum.error 
      });
    }
    
    // 2. Vérifier si l'ancienne valeur existe
    if (!currentEnum.values.includes(oldValue)) {
      return res.status(400).json({ 
        success: false, 
        message: `La valeur ${oldValue} n'existe pas dans ${tableName}.${columnName}` 
      });
    }
    
    // 3. Vérifier si la nouvelle valeur existe déjà (sauf si c'est la même)
    if (oldValue !== newValue && currentEnum.values.includes(newValue)) {
      return res.status(400).json({ 
        success: false, 
        message: `La valeur ${newValue} existe déjà dans ${tableName}.${columnName}` 
      });
    }
    
    // 4. Mettre à jour la liste des valeurs
    const newValues = currentEnum.values.map(val => val === oldValue ? newValue : val);
    
    // 5. Construire la requête SQL pour modifier la colonne ENUM
    const enumDefinition = newValues.map(val => `'${val.replace(/'/g, "''")}'`).join(',');
    const modifyQuery = `ALTER TABLE ${tableName} MODIFY COLUMN ${columnName} ENUM(${enumDefinition})`;
    
    // 6. Mettre à jour les données existantes qui utilisent cette valeur
    const updateQuery = `UPDATE ${tableName} SET ${columnName} = '${newValue.replace(/'/g, "''")}' WHERE ${columnName} = '${oldValue.replace(/'/g, "''")}'`;
    
    // 7. Exécuter les requêtes dans une transaction
    await db.sequelize.query(updateQuery, { transaction });
    await db.sequelize.query(modifyQuery, { transaction });
    
    // 8. Valider la transaction
    await transaction.commit();
    
    res.status(200).json({ 
      success: true, 
      message: `Value ${oldValue} updated to ${newValue} in ${tableName}.${columnName} successfully`,
      data: {
        tableName,
        columnName,
        values: newValues
      }
    });
  } catch (error) {
    // En cas d'erreur, annuler la transaction
    await transaction.rollback();
    console.error('Erreur dans le contrôleur updateEnumValue:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Supprimer une valeur d'une colonne ENUM
exports.deleteEnumValue = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { tableName, columnName } = req.params;
    const { value } = req.body;
    
    if (!tableName || !columnName || !value) {
      return res.status(400).json({ 
        success: false, 
        message: 'Le nom de la table, le nom de la colonne et la valeur sont requis' 
      });
    }
    
    // 1. Récupérer les valeurs actuelles de l'enum
    const currentEnum = await EnumModel.getEnumValues(tableName, columnName);
    
    if (currentEnum.error) {
      return res.status(404).json({ 
        success: false, 
        message: currentEnum.error 
      });
    }
    
    // 2. Vérifier si la valeur existe
    if (!currentEnum.values.includes(value)) {
      return res.status(400).json({ 
        success: false, 
        message: `La valeur ${value} n'existe pas dans ${tableName}.${columnName}` 
      });
    }
    
    // 3. Vérifier si la valeur est utilisée dans la table
    const checkQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${columnName} = '${value.replace(/'/g, "''")}'`;
    const [checkResult] = await db.sequelize.query(checkQuery);
    
    if (checkResult[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Impossible de supprimer la valeur ${value} car elle est utilisée dans ${checkResult[0].count} enregistrements` 
      });
    }
    
    // 4. Supprimer la valeur de la liste
    const newValues = currentEnum.values.filter(val => val !== value);
    
    // 5. Si aucune valeur ne reste, nous ne pouvons pas avoir un ENUM vide en MySQL
    if (newValues.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Impossible de supprimer la dernière valeur de l'enum ${tableName}.${columnName}` 
      });
    }
    
    // 6. Construire la requête SQL pour modifier la colonne ENUM
    const enumDefinition = newValues.map(val => `'${val.replace(/'/g, "''")}'`).join(',');
    const modifyQuery = `ALTER TABLE ${tableName} MODIFY COLUMN ${columnName} ENUM(${enumDefinition})`;
    
    // 7. Exécuter la requête
    await db.sequelize.query(modifyQuery, { transaction });
    
    // 8. Valider la transaction
    await transaction.commit();
    
    res.status(200).json({ 
      success: true, 
      message: `Value ${value} removed from ${tableName}.${columnName} successfully`,
      data: {
        tableName,
        columnName,
        values: newValues
      }
    });
  } catch (error) {
    // En cas d'erreur, annuler la transaction
    await transaction.rollback();
    console.error('Erreur dans le contrôleur deleteEnumValue:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};