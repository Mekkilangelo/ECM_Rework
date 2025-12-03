const db = require('../models');
const { Sequelize } = require('sequelize');

/**
 * Service pour gérer les tables de référence (ref_*)
 * Fournit des fonctions CRUD pour toutes les tables de référence de la base de données
 */

/**
 * Liste de toutes les tables de référence disponibles
 */
const REFERENCE_TABLES = [
  'ref_cooling_media',
  'ref_country',
  'ref_designation',
  'ref_file_category',
  'ref_file_subcategory',
  'ref_furnace_sizes',
  'ref_furnace_types',
  'ref_heating_cells',
  'ref_location',
  'ref_mounting_type',
  'ref_node_data_status',
  'ref_position_type',
  'ref_process_type',
  'ref_quench_cells',
  'ref_roles',
  'ref_status',
  'ref_steel_elements',
  'ref_steel_family',
  'ref_steel_standard',
  'ref_units',
  'ref_unit_types'
];

/**
 * Valide qu'une table existe dans la liste des tables de référence
 * @param {string} tableName - Nom de la table à valider
 * @returns {boolean} - True si la table est valide
 * @throws {Error} - Si la table n'existe pas
 */
const validateTableName = (tableName) => {
  if (!tableName) {
    throw new Error('Le nom de la table est requis');
  }
  
  if (!REFERENCE_TABLES.includes(tableName)) {
    throw new Error(`Table de référence invalide: ${tableName}. Tables disponibles: ${REFERENCE_TABLES.join(', ')}`);
  }
  
  return true;
};

/**
 * Récupère la liste de toutes les tables de référence
 * @returns {Array<string>} - Liste des noms de tables
 */
const getAllTables = () => {
  return REFERENCE_TABLES;
};

/**
 * Récupère toutes les valeurs d'une table de référence
 * @param {string} tableName - Nom de la table de référence
 * @returns {Promise<Array<string|Object>>} - Liste des valeurs (strings simples ou objets pour tables complexes)
 * @throws {Error} - Si la table n'existe pas ou en cas d'erreur
 */
const getValues = async (tableName) => {
  try {
    validateTableName(tableName);
    
    // Tables spéciales qui nécessitent plusieurs colonnes
    const COMPLEX_TABLES = {
      'ref_units': ['name', 'unit_type', 'description'],
      'ref_unit_types': ['type_name', 'description']
    };
    
    // Si c'est une table complexe, retourner tous les champs
    if (COMPLEX_TABLES[tableName]) {
      const columns = COMPLEX_TABLES[tableName];
      const query = `SELECT ${columns.join(', ')} FROM ${tableName} ORDER BY ${columns[0]}`;
      const results = await db.sequelize.query(query, {
        type: Sequelize.QueryTypes.SELECT
      });
      
      // Pour ref_unit_types, renommer type_name en name pour cohérence
      if (tableName === 'ref_unit_types') {
        return results.map(row => ({
          name: row.type_name,
          description: row.description
        }));
      }
      
      return results;
    }
    
    // Pour les tables simples, ne retourner que la colonne 'name'
    const query = `SELECT name FROM ${tableName} ORDER BY name`;
    const results = await db.sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    // Retourner un tableau de valeurs (strings)
    return results.map(row => row.name);
  } catch (error) {
    console.error(`Erreur lors de la récupération des valeurs de ${tableName}:`, error);
    throw error;
  }
};

/**
 * Ajoute une nouvelle valeur à une table de référence
 * @param {string} tableName - Nom de la table de référence
 * @param {string|Object} value - Valeur à ajouter (string simple ou objet avec champs additionnels)
 * @param {Object} additionalData - Données additionnelles (ex: unit_type pour ref_units)
 * @returns {Promise<Object>} - Résultat de l'opération
 * @throws {Error} - Si la table n'existe pas, la valeur est invalide, ou existe déjà
 */
const addValue = async (tableName, value, additionalData = {}) => {
  try {
    validateTableName(tableName);
    
    // Si value est un objet, extraire le name et merger avec additionalData
    let valueName;
    let extraFields = { ...additionalData };
    
    if (typeof value === 'object' && value !== null) {
      valueName = value.name || value.value;
      extraFields = { ...value, ...additionalData };
      delete extraFields.name;
      delete extraFields.value;
    } else {
      valueName = value;
    }
    
    if (!valueName || typeof valueName !== 'string' || !valueName.trim()) {
      throw new Error('La valeur est requise et doit être une chaîne non vide');
    }
    
    const trimmedValue = valueName.trim();
    
    // Vérifier si la valeur existe déjà
    const checkQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE name = ?`;
    const checkResults = await db.sequelize.query(checkQuery, {
      replacements: [trimmedValue],
      type: Sequelize.QueryTypes.SELECT
    });
    
    if (checkResults[0].count > 0) {
      throw new Error(`La valeur "${trimmedValue}" existe déjà dans ${tableName}`);
    }
    
    // Construire la requête d'insertion selon la table
    let insertQuery;
    let replacements;
    
    if (tableName === 'ref_units' && extraFields.unit_type) {
      // Pour ref_units, inclure le unit_type
      insertQuery = `INSERT INTO ${tableName} (name, unit_type) VALUES (?, ?)`;
      replacements = [trimmedValue, extraFields.unit_type];
    } else if (tableName === 'ref_unit_types' && extraFields.description) {
      // Pour ref_unit_types, la clé primaire est type_name
      const checkQuery2 = `SELECT COUNT(*) as count FROM ${tableName} WHERE type_name = ?`;
      const checkResults2 = await db.sequelize.query(checkQuery2, {
        replacements: [trimmedValue],
        type: Sequelize.QueryTypes.SELECT
      });
      
      if (checkResults2[0].count > 0) {
        throw new Error(`Le type "${trimmedValue}" existe déjà dans ${tableName}`);
      }
      
      insertQuery = `INSERT INTO ${tableName} (type_name, description) VALUES (?, ?)`;
      replacements = [trimmedValue, extraFields.description || null];
    } else {
      // Pour les autres tables, juste le name
      insertQuery = `INSERT INTO ${tableName} (name) VALUES (?)`;
      replacements = [trimmedValue];
    }
    
    await db.sequelize.query(insertQuery, { replacements });
    
    return {
      success: true,
      message: `Valeur "${trimmedValue}" ajoutée avec succès à ${tableName}`,
      value: trimmedValue
    };
  } catch (error) {
    console.error(`Erreur lors de l'ajout d'une valeur à ${tableName}:`, error);
    throw error;
  }
};

/**
 * Supprime une valeur d'une table de référence
 * @param {string} tableName - Nom de la table de référence
 * @param {string} value - Valeur à supprimer
 * @returns {Promise<Object>} - Résultat de l'opération
 * @throws {Error} - Si la table n'existe pas, la valeur n'existe pas, ou est utilisée ailleurs
 */
const deleteValue = async (tableName, value) => {
  try {
    validateTableName(tableName);
    
    if (!value || typeof value !== 'string') {
      throw new Error('La valeur est requise');
    }
    
    // Vérifier si la valeur existe
    const checkQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE name = ?`;
    const checkResults = await db.sequelize.query(checkQuery, {
      replacements: [value],
      type: Sequelize.QueryTypes.SELECT
    });
    
    if (checkResults[0].count === 0) {
      throw new Error(`La valeur "${value}" n'existe pas dans ${tableName}`);
    }
    
    // Vérifier si la valeur est utilisée dans d'autres tables (contraintes FK)
    // Cette vérification sera effectuée par MySQL via les contraintes de clé étrangère
    // Si la valeur est utilisée, MySQL renverra une erreur que nous attraperons
    
    const deleteQuery = `DELETE FROM ${tableName} WHERE name = ?`;
    await db.sequelize.query(deleteQuery, {
      replacements: [value]
    });
    
    return {
      success: true,
      message: `Valeur "${value}" supprimée avec succès de ${tableName}`
    };
  } catch (error) {
    // Vérifier si c'est une erreur de contrainte de clé étrangère
    if (error.parent && error.parent.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new Error(`Impossible de supprimer "${value}" car elle est utilisée dans d'autres enregistrements`);
    }
    
    console.error(`Erreur lors de la suppression d'une valeur de ${tableName}:`, error);
    throw error;
  }
};

/**
 * Compte le nombre d'utilisations d'une valeur de référence
 * Cette fonction vérifie dans quelles tables la valeur est référencée
 * @param {string} tableName - Nom de la table de référence
 * @param {string} value - Valeur à vérifier
 * @returns {Promise<Object>} - Informations sur l'utilisation
 */
const checkUsage = async (tableName, value) => {
  try {
    validateTableName(tableName);
    
    // Mapping des tables de référence vers les tables qui les utilisent
    const usageMappings = {
      ref_file_category: [
        { table: 'files', column: 'category' }
      ],
      ref_file_subcategory: [
        { table: 'files', column: 'subcategory' }
      ],
      ref_country: [
        { table: 'clients', column: 'country' }
      ],
      ref_designation: [
        { table: 'parts', column: 'designation' }
      ],
      ref_furnace_types: [
        { table: 'furnaces', column: 'furnace_type' }
      ],
      ref_furnace_sizes: [
        { table: 'furnaces', column: 'furnace_size' }
      ],
      ref_heating_cells: [
        { table: 'furnaces', column: 'heating_cell' }
      ],
      ref_cooling_media: [
        { table: 'furnaces', column: 'cooling_media' }
      ],
      ref_quench_cells: [
        { table: 'furnaces', column: 'quench_cell' }
      ],
      ref_mounting_type: [
        { table: 'trials', column: 'mounting_type' }
      ],
      ref_position_type: [
        { table: 'trials', column: 'position_type' }
      ],
      ref_process_type: [
        { table: 'trials', column: 'process_type' }
      ],
      ref_status: [
        { table: 'trials', column: 'status' }
      ],
      ref_node_data_status: [
        { table: 'nodes', column: 'data_status' }
      ],
      ref_steel_family: [
        { table: 'steels', column: 'family' }
      ],
      ref_steel_standard: [
        { table: 'steels', column: 'standard' }
      ],
      ref_units: [
        { table: 'parts', column: 'length_unit' },
        { table: 'parts', column: 'diameter_unit' },
        { table: 'parts', column: 'thickness_unit' },
        { table: 'parts', column: 'weight_unit' }
      ],
      ref_unit_types: [
        { table: 'ref_units', column: 'unit_type' }
      ]
    };
    
    const usages = usageMappings[tableName] || [];
    let totalCount = 0;
    const details = [];
    
    // Pour chaque table qui pourrait utiliser cette référence
    for (const usage of usages) {
      const countQuery = `SELECT COUNT(*) as count FROM ${usage.table} WHERE ${usage.column} = ?`;
      const countResults = await db.sequelize.query(countQuery, {
        replacements: [value],
        type: Sequelize.QueryTypes.SELECT
      });
      
      if (countResults[0].count > 0) {
        totalCount += countResults[0].count;
        details.push({
          table: usage.table,
          column: usage.column,
          count: countResults[0].count
        });
      }
    }
    
    return {
      value,
      tableName,
      totalCount,
      details,
      canDelete: totalCount === 0
    };
  } catch (error) {
    console.error(`Erreur lors de la vérification de l'utilisation de ${value} dans ${tableName}:`, error);
    throw error;
  }
};

/**
 * Met à jour une valeur de référence et toutes ses utilisations dans la base
 * @param {string} tableName - Nom de la table de référence
 * @param {string} oldValue - Ancienne valeur à remplacer
 * @param {string} newValue - Nouvelle valeur
 * @returns {Promise<Object>} - Résultat de l'opération
 * @throws {Error} - Si la table n'existe pas, les valeurs sont invalides, ou la nouvelle valeur existe déjà
 */
const updateValue = async (tableName, oldValue, newValue) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    validateTableName(tableName);
    
    if (!oldValue || typeof oldValue !== 'string') {
      throw new Error('L\'ancienne valeur est requise');
    }
    
    if (!newValue || typeof newValue !== 'string' || !newValue.trim()) {
      throw new Error('La nouvelle valeur est requise et doit être une chaîne non vide');
    }
    
    const trimmedNewValue = newValue.trim();
    
    // Vérifier que l'ancienne valeur existe
    const checkOldQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE name = ?`;
    const checkOldResults = await db.sequelize.query(checkOldQuery, {
      replacements: [oldValue],
      type: Sequelize.QueryTypes.SELECT,
      transaction
    });
    
    if (checkOldResults[0].count === 0) {
      throw new Error(`La valeur "${oldValue}" n'existe pas dans ${tableName}`);
    }
    
    // Si c'est la même valeur, pas besoin de faire quoi que ce soit
    if (oldValue === trimmedNewValue) {
      await transaction.rollback();
      return {
        success: true,
        message: 'Aucune modification nécessaire (même valeur)',
        value: trimmedNewValue
      };
    }
    
    // Vérifier que la nouvelle valeur n'existe pas déjà
    const checkNewQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE name = ?`;
    const checkNewResults = await db.sequelize.query(checkNewQuery, {
      replacements: [trimmedNewValue],
      type: Sequelize.QueryTypes.SELECT,
      transaction
    });
    
    if (checkNewResults[0].count > 0) {
      throw new Error(`La valeur "${trimmedNewValue}" existe déjà dans ${tableName}`);
    }
    
    // Ajouter la nouvelle valeur
    const insertQuery = `INSERT INTO ${tableName} (name) VALUES (?)`;
    await db.sequelize.query(insertQuery, {
      replacements: [trimmedNewValue],
      transaction
    });
    
    // Mettre à jour toutes les références dans les autres tables
    const usage = await checkUsage(tableName, oldValue);
    
    for (const detail of usage.details) {
      const updateQuery = `UPDATE ${detail.table} SET ${detail.column} = ? WHERE ${detail.column} = ?`;
      await db.sequelize.query(updateQuery, {
        replacements: [trimmedNewValue, oldValue],
        transaction
      });
    }
    
    // Supprimer l'ancienne valeur
    const deleteQuery = `DELETE FROM ${tableName} WHERE name = ?`;
    await db.sequelize.query(deleteQuery, {
      replacements: [oldValue],
      transaction
    });
    
    await transaction.commit();
    
    return {
      success: true,
      message: `Valeur "${oldValue}" mise à jour vers "${trimmedNewValue}" avec succès`,
      oldValue,
      newValue: trimmedNewValue,
      updatedReferences: usage.totalCount
    };
  } catch (error) {
    await transaction.rollback();
    console.error(`Erreur lors de la mise à jour de ${oldValue} vers ${newValue} dans ${tableName}:`, error);
    throw error;
  }
};

/**
 * Remplace une valeur par une autre puis supprime l'ancienne
 * Utile quand on veut fusionner deux valeurs existantes
 * @param {string} tableName - Nom de la table de référence
 * @param {string} oldValue - Valeur à remplacer et supprimer
 * @param {string} replacementValue - Valeur de remplacement (doit exister)
 * @returns {Promise<Object>} - Résultat de l'opération
 * @throws {Error} - Si la table n'existe pas ou les valeurs sont invalides
 */
const replaceAndDelete = async (tableName, oldValue, replacementValue) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    validateTableName(tableName);
    
    if (!oldValue || typeof oldValue !== 'string') {
      throw new Error('L\'ancienne valeur est requise');
    }
    
    if (!replacementValue || typeof replacementValue !== 'string') {
      throw new Error('La valeur de remplacement est requise');
    }
    
    // Vérifier que les deux valeurs existent
    const checkOldQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE name = ?`;
    const checkOldResults = await db.sequelize.query(checkOldQuery, {
      replacements: [oldValue],
      type: Sequelize.QueryTypes.SELECT,
      transaction
    });
    
    if (checkOldResults[0].count === 0) {
      throw new Error(`La valeur "${oldValue}" n'existe pas dans ${tableName}`);
    }
    
    const checkReplacementQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE name = ?`;
    const checkReplacementResults = await db.sequelize.query(checkReplacementQuery, {
      replacements: [replacementValue],
      type: Sequelize.QueryTypes.SELECT,
      transaction
    });
    
    if (checkReplacementResults[0].count === 0) {
      throw new Error(`La valeur de remplacement "${replacementValue}" n'existe pas dans ${tableName}`);
    }
    
    // Si c'est la même valeur, pas besoin de faire quoi que ce soit
    if (oldValue === replacementValue) {
      await transaction.rollback();
      return {
        success: true,
        message: 'Aucune modification nécessaire (même valeur)',
        value: replacementValue
      };
    }
    
    // Mettre à jour toutes les références
    const usage = await checkUsage(tableName, oldValue);
    
    for (const detail of usage.details) {
      const updateQuery = `UPDATE ${detail.table} SET ${detail.column} = ? WHERE ${detail.column} = ?`;
      await db.sequelize.query(updateQuery, {
        replacements: [replacementValue, oldValue],
        transaction
      });
    }
    
    // Supprimer l'ancienne valeur
    const deleteQuery = `DELETE FROM ${tableName} WHERE name = ?`;
    await db.sequelize.query(deleteQuery, {
      replacements: [oldValue],
      transaction
    });
    
    await transaction.commit();
    
    return {
      success: true,
      message: `Valeur "${oldValue}" remplacée par "${replacementValue}" et supprimée avec succès`,
      oldValue,
      replacementValue,
      updatedReferences: usage.totalCount
    };
  } catch (error) {
    await transaction.rollback();
    console.error(`Erreur lors du remplacement de ${oldValue} par ${replacementValue} dans ${tableName}:`, error);
    throw error;
  }
};

/**
 * Remplace une valeur de référence par une autre puis supprime l'ancienne
 * Combine l'update et le delete en une seule opération
 * @param {string} tableName - Nom de la table de référence
 * @param {string} oldValue - Valeur à remplacer et supprimer
 * @param {string} newValue - Valeur de remplacement (doit déjà exister)
 * @returns {Promise<Object>} Résultat de l'opération
 */
const replaceValue = async (tableName, oldValue, newValue) => {
  // Utiliser replaceAndDelete qui remplace avec une valeur existante
  const result = await replaceAndDelete(tableName, oldValue, newValue);
  return {
    message: result.message,
    oldValue: result.oldValue,
    newValue: result.replacementValue,
    updatedCount: result.updatedReferences
  };
};

/**
 * Supprime une valeur de référence en mettant toutes ses utilisations à NULL
 * Utilisé pour forcer la suppression même si la valeur est référencée
 * @param {string} tableName - Nom de la table de référence
 * @param {string} value - Valeur à supprimer
 * @returns {Promise<Object>} Résultat de l'opération
 */
const forceDelete = async (tableName, value) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    validateTableName(tableName);
    
    if (!value || typeof value !== 'string') {
      throw new Error('La valeur est requise');
    }
    
    // Vérifier si la valeur existe
    const checkQuery = `SELECT COUNT(*) as count FROM ${tableName} WHERE name = ?`;
    const checkResults = await db.sequelize.query(checkQuery, {
      replacements: [value],
      type: Sequelize.QueryTypes.SELECT,
      transaction
    });
    
    if (checkResults[0].count === 0) {
      throw new Error(`La valeur "${value}" n'existe pas dans ${tableName}`);
    }
    
    // Trouver toutes les utilisations et les mettre à NULL
    const usage = await checkUsage(tableName, value);
    
    for (const detail of usage.details) {
      const updateQuery = `UPDATE ${detail.table} SET ${detail.column} = NULL WHERE ${detail.column} = ?`;
      await db.sequelize.query(updateQuery, {
        replacements: [value],
        transaction
      });
    }
    
    // Supprimer la valeur
    const deleteQuery = `DELETE FROM ${tableName} WHERE name = ?`;
    await db.sequelize.query(deleteQuery, {
      replacements: [value],
      transaction
    });
    
    await transaction.commit();
    
    return {
      success: true,
      message: `Valeur "${value}" supprimée avec succès (${usage.totalCount} référence(s) mise(s) à NULL)`,
      value,
      updatedReferences: usage.totalCount
    };
  } catch (error) {
    await transaction.rollback();
    console.error(`Erreur lors de la suppression forcée de ${value} dans ${tableName}:`, error);
    throw error;
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
  replaceAndDelete,
  REFERENCE_TABLES
};
