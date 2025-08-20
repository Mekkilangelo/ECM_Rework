/**
 * Service de gestion des aciers
 * Contient la logique métier liée aux opérations sur les aciers
 */

const { node, steel, closure, sequelize } = require('../models');
const { Op } = require('sequelize');
const { validateSteelData } = require('../utils/validators');
const { 
  NotFoundError, 
  ValidationError 
} = require('../utils/errors');
const { updateAncestorsModifiedAt } = require('../utils/hierarchyUtils');
const logger = require('../utils/logger');

/**
 * Standardise le format d'un équivalent
 * @param {Object|number|string} equivalent - Équivalent à standardiser
 * @returns {Object} Équivalent au format standardisé
 */
const standardizeEquivalent = (equivalent) => {
  if (typeof equivalent === 'number' || typeof equivalent === 'string') {
    return {
      steel_id: parseInt(equivalent),
      standard: ""
    };
  }
  
  if (typeof equivalent === 'object' && equivalent !== null) {
    const steelId = equivalent.steel_id || equivalent.steelId || equivalent.id;
    return {
      steel_id: parseInt(steelId),
      standard: equivalent.standard || ""
    };
  }
  
  throw new Error('Format d\'équivalent invalide');
};

/**
 * Normalise une liste d'équivalents
 * @param {Array} equivalents - Liste d'équivalents à normaliser
 * @returns {Array} Liste d'équivalents normalisés
 */
const normalizeEquivalents = (equivalents) => {
  if (!Array.isArray(equivalents)) {
    return [];
  }
  
  return equivalents
    .filter(eq => eq !== null && eq !== undefined)
    .map(standardizeEquivalent)
    .filter(eq => !isNaN(eq.steel_id) && eq.steel_id > 0);
};

/**
 * Récupère tous les aciers avec pagination et filtrage
 * @param {Object} options - Options de pagination et filtrage
 * @returns {Promise<Object>} Liste paginée des aciers
 */
const getAllSteels = async (options = {}) => {
  logger.info('=== getAllSteels called ===');
  logger.info('Options reçues:', JSON.stringify(options, null, 2));
  
  const { 
    limit = 10, 
    offset = 0, 
    sortBy = 'modified_at', 
    sortOrder = 'DESC',
    search = null,
    filter = null
  } = options;
  
  logger.info('Paramètres extraits:', { limit, offset, sortBy, sortOrder, search, filter });
  
  const whereCondition = { type: 'steel' };
  
  // Recherche textuelle
  if (search) {
    whereCondition[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
      sequelize.literal(`steel.grade LIKE '%${search.replace(/'/g, "''")}%'`)
    ];
    logger.info('Condition de recherche ajoutée:', whereCondition[Op.or]);
  }
  
  // Filtrage par propriétés
  if (filter) {
    if (filter.grade) {
      whereCondition['$steel.grade$'] = filter.grade;
    }
    if (filter.standard) {
      whereCondition['$steel.standard$'] = filter.standard;
    }
    if (filter.family) {
      whereCondition['$steel.family$'] = filter.family;
    }
    logger.info('Filtres appliqués:', filter);
  }
  
  logger.info('Condition WHERE finale:', JSON.stringify(whereCondition, null, 2));
  
  // Déterminer l'ordre en fonction de la colonne à trier
  let orderClause;
  const steelColumns = ['grade', 'family', 'standard'];
  
  if (steelColumns.includes(sortBy)) {
    // Si c'est une colonne de la table Steel, utiliser la syntaxe d'association
    orderClause = [[{ model: steel }, sortBy, sortOrder]];
  } else {
    // Si c'est une colonne de Node (name, modified_at, etc.)
    orderClause = [[sortBy, sortOrder]];
  }
  
  logger.info('Clause ORDER BY:', JSON.stringify(orderClause, null, 2));

  try {
    // Exécuter la requête
    logger.info('Exécution de la requête Node.findAll...');
    const steels = await node.findAll({
      where: whereCondition,
      include: [{
        model: steel,
        attributes: ['grade', 'family', 'standard', 'equivalents', 'chemistery', 'elements']
      }],
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    logger.info(`Nombre d'aciers trouvés: ${steels.length}`);
    if (steels.length > 0) {
      logger.info('Premier acier trouvé:', JSON.stringify(steels[0].toJSON(), null, 2));
    }
    
    // Compter le total pour la pagination
    logger.info('Comptage du total...');
    const total = await node.count({
      where: whereCondition,
      include: [{
        model: steel,
        attributes: []
      }]
    });
    
    logger.info(`Total d'aciers: ${total}`);
    
    const result = {
      steels,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    };
    
    logger.info('Résultat final:', {
      steelsCount: result.steels.length,
      pagination: result.pagination
    });
    
    return result;
  } catch (error) {
    logger.error('Erreur dans getAllSteels:', error.message);
    logger.error('Stack trace:', error.stack);
    throw error;
  }
};

/**
 * Récupère toutes les nuances d'acier distinctes
 * @returns {Promise<Array>} Liste des nuances d'acier
 */
const getSteelGrades = async () => {
  const steels = await node.findAll({
    where: { type: 'steel' },
    include: [{
      model: steel,
      attributes: ['grade', 'family', 'standard']
    }],
    order: [[{ model: steel }, 'grade', 'ASC']]
  });
  
  // Extraire les grades uniques
  const grades = steels
    .filter(node => node.steel && node.steel.grade)
    .map(node => ({
      grade: node.steel.grade,
      family: node.steel.family,
      standard: node.steel.standard
    }))
    .filter((grade, index, self) => 
      self.findIndex(g => g.grade === grade.grade) === index
    );
  
  return grades;
};

/**
 * Récupère un acier par son ID
 * @param {number} steelId - ID de l'acier
 * @returns {Promise<Object>} Détails de l'acier
 */
const getSteelById = async (steelId) => {
  const steelNode = await node.findByPk(steelId, {
    include: [{
      model: steel,
      attributes: ['grade', 'family', 'standard', 'equivalents', 'chemistery', 'elements']
    }]
  });
  
  if (!steelNode || steelNode.type !== 'steel') {
    throw new NotFoundError('Acier non trouvé');
  }
  
  return steelNode;
};

/**
 * Ajoute la réciprocité des équivalents
 * @param {number} steelId - ID de l'acier
 * @param {Array} equivalents - Liste des équivalents
 * @param {Object} transaction - Transaction Sequelize
 */
const addReciprocalEquivalents = async (steelId, equivalents, transaction) => {
  if (!equivalents || equivalents.length === 0) return;
  
  logger.info(`Ajout de réciprocité pour l'acier ${steelId} vers:`, equivalents.map(eq => eq.steel_id || eq.steelId || eq.id));
  
  for (const equivalent of equivalents) {
    // Vérifier les différents formats possibles de l'ID
    const equivalentId = equivalent.steel_id || equivalent.steelId || equivalent.id;
    
    if (equivalentId) {
      logger.info(`Traitement de l'équivalent ${equivalentId}...`);
      
      // Récupérer l'acier équivalent
      const equivalentSteel = await steel.findOne({
        where: { node_id: equivalentId },
        transaction
      });
      
      if (equivalentSteel) {
        let currentEquivalents = equivalentSteel.equivalents || [];
        
        logger.info(`Équivalents actuels de l'acier ${equivalentId}:`, currentEquivalents);
        
        // Vérifier si la réciprocité n'existe pas déjà
        const alreadyExists = currentEquivalents.some(eq => {
          const existingId = eq.steel_id || eq.steelId || eq.id;
          return existingId == steelId;
        });
          if (!alreadyExists) {
          currentEquivalents.push(standardizeEquivalent(steelId));
          
          logger.info(`Ajout de la réciprocité: acier ${equivalentId} -> acier ${steelId}`);
          
          // Utiliser une requête SQL directe pour forcer la mise à jour du JSON
          await sequelize.query(
            'UPDATE steels SET equivalents = ? WHERE node_id = ?',
            {
              replacements: [JSON.stringify(currentEquivalents), equivalentId],
              type: sequelize.QueryTypes.UPDATE,
              transaction
            }
          );
        } else {
          logger.info(`Réciprocité déjà existante: acier ${equivalentId} -> acier ${steelId}`);
        }
      } else {
        logger.warn(`Acier équivalent ${equivalentId} non trouvé`);
      }
    }
  }
};

/**
 * Supprime la réciprocité des équivalents
 * @param {number} steelId - ID de l'acier
 * @param {Array} equivalents - Liste des équivalents à supprimer
 * @param {Object} transaction - Transaction Sequelize
 */
const removeReciprocalEquivalents = async (steelId, equivalents, transaction) => {
  if (!equivalents || equivalents.length === 0) return;
  
  for (const equivalent of equivalents) {
    const equivalentId = equivalent.steel_id || equivalent.steelId || equivalent.id;
    
    if (equivalentId) {
      const equivalentSteel = await steel.findOne({
        where: { node_id: equivalentId },
        transaction
      });
      
      if (equivalentSteel && equivalentSteel.equivalents) {
        const updatedEquivalents = equivalentSteel.equivalents.filter(
          eq => eq.steel_id != steelId
        );
        
        // Utiliser une requête SQL directe pour forcer la mise à jour du JSON
        await sequelize.query(
          'UPDATE steels SET equivalents = ? WHERE node_id = ?',
          {
            replacements: [JSON.stringify(updatedEquivalents), equivalentId],
            type: sequelize.QueryTypes.UPDATE,
            transaction
          }
        );
      }
    }
  }
};

/**
 * Crée un nouvel acier
 * @param {Object} steelData - Données de l'acier
 * @returns {Promise<Object>} Acier créé
 */
const createSteel = async (steelData) => {
  const { name, grade, family, standard, equivalents, chemistery, elements, description } = steelData;
  
  // Validation des données de base
  if (!name || !grade) {
    throw new ValidationError('Nom et grade requis');
  }
  
  // Normaliser les équivalents
  const normalizedEquivalents = normalizeEquivalents(equivalents);
  
  // Vérifier si la nuance existe déjà
  const existingSteel = await node.findOne({
    where: { type: 'steel' },
    include: [{
      model: steel,
      where: {
        grade: grade,
        standard: standard || null
      }
    }]
  });
  
  if (existingSteel) {
    throw new ValidationError('Cette nuance d\'acier existe déjà dans ce standard');
  }
  
  // Créer l'acier dans une transaction
  const result = await sequelize.transaction(async (t) => {
    // Créer le nœud
    const newNode = await node.create({
      name,
      path: `/${name}`,
      type: 'steel',
      parent_id: null,
      created_at: new Date(),
      modified_at: new Date(),
      data_status: 'new',
      description
    }, { transaction: t });
    
    // Créer les données de l'acier
    await steel.create({
      node_id: newNode.id,
      grade,
      family,
      standard,
      equivalents: normalizedEquivalents,
      chemistery,
      elements
    }, { transaction: t });
    
    // Ajouter la réciprocité des équivalents
    if (normalizedEquivalents && normalizedEquivalents.length > 0) {
      await addReciprocalEquivalents(newNode.id, normalizedEquivalents, t);
    }
    
    return newNode;
  });
  
  // Mettre à jour le modified_at de l'acier et de ses ancêtres après création
  await updateAncestorsModifiedAt(result.id);
  
  // Récupérer l'acier complet
  const newSteel = await getSteelById(result.id);
  return newSteel;
};

/**
 * Met à jour un acier existant
 * @param {number} steelId - ID de l'acier
 * @param {Object} steelData - Nouvelles données
 * @returns {Promise<Object>} Acier mis à jour
 */
const updateSteel = async (steelId, steelData) => {
  // Récupérer l'acier existant
  const steelNode = await node.findOne({
    where: { id: steelId, type: 'steel' },
    include: [{
      model: steel
    }]
  });
  
  if (!steelNode) {
    throw new NotFoundError('Acier non trouvé');
  }
  
  // Vérifier si la mise à jour crée un doublon de nuance/standard
  if (steelData.grade && steelData.standard) {
    const existingSteel = await node.findOne({
      where: { 
        id: { [Op.ne]: steelId },
        type: 'steel'
      },
      include: [{
        model: steel,
        where: {
          grade: steelData.grade,
          standard: steelData.standard
        }
      }]
    });
    
    if (existingSteel) {
      throw new ValidationError('Cette nuance d\'acier existe déjà dans ce standard');
    }
  }
  
  // Mettre à jour dans une transaction
  await sequelize.transaction(async (t) => {    // Gérer les équivalents si modifiés
    if (steelData.equivalents !== undefined) {
      const oldEquivalents = normalizeEquivalents(steel.steel.equivalents || []);
      const newEquivalents = normalizeEquivalents(steelData.equivalents || []);
      
      // Identifier les équivalents à ajouter et à supprimer
      const oldEquivalentIds = oldEquivalents.map(eq => {
        const id = eq.steel_id || eq.steelId || eq.id;
        return id ? parseInt(id) : null;
      }).filter(id => id !== null);
      
      const newEquivalentIds = newEquivalents.map(eq => {
        const id = eq.steel_id || eq.steelId || eq.id;
        return id ? parseInt(id) : null;
      }).filter(id => id !== null);
      
      // Équivalents à supprimer (présents dans l'ancien mais pas dans le nouveau)
      const equivalentsToRemove = oldEquivalents.filter(oldEq => {
        const oldId = oldEq.steel_id || oldEq.steelId || oldEq.id;
        const parsedOldId = oldId ? parseInt(oldId) : null;
        return parsedOldId && !newEquivalentIds.includes(parsedOldId);
      });
      
      // Équivalents à ajouter (présents dans le nouveau mais pas dans l'ancien)
      const equivalentsToAdd = newEquivalents.filter(newEq => {
        const newId = newEq.steel_id || newEq.steelId || newEq.id;
        const parsedNewId = newId ? parseInt(newId) : null;
        return parsedNewId && !oldEquivalentIds.includes(parsedNewId);
      });
      
      logger.info(`Mise à jour des équivalents pour l'acier ${steelId}:`);
      logger.info(`- Anciens équivalents: ${oldEquivalentIds.join(', ')}`);
      logger.info(`- Nouveaux équivalents: ${newEquivalentIds.join(', ')}`);
      logger.info(`- À supprimer: ${equivalentsToRemove.map(eq => eq.steel_id || eq.steelId || eq.id).join(', ')}`);
      logger.info(`- À ajouter: ${equivalentsToAdd.map(eq => eq.steel_id || eq.steelId || eq.id).join(', ')}`);
      
      // Supprimer les réciprocités pour les équivalents supprimés
      if (equivalentsToRemove.length > 0) {
        await removeReciprocalEquivalents(steelId, equivalentsToRemove, t);
      }
      
      // Ajouter les réciprocités pour les nouveaux équivalents
      if (equivalentsToAdd.length > 0) {
        await addReciprocalEquivalents(steelId, equivalentsToAdd, t);
      }
    }
    
    // Mettre à jour le nœud si nécessaire
    if (steelData.name || steelData.description) {
      const nodeUpdates = {};
      if (steelData.name) {
        nodeUpdates.name = steelData.name;
        nodeUpdates.path = `/${steelData.name}`;
      }
      if (steelData.description !== undefined) {
        nodeUpdates.description = steelData.description;
      }
      nodeUpdates.modified_at = new Date();
      
      await steel.update(nodeUpdates, { transaction: t });
    }
      // Mettre à jour les données Steel
    const steelUpdates = {};
    if (steelData.grade !== undefined) steelUpdates.grade = steelData.grade;
    if (steelData.family !== undefined) steelUpdates.family = steelData.family;
    if (steelData.standard !== undefined) steelUpdates.standard = steelData.standard;
    if (steelData.equivalents !== undefined) steelUpdates.equivalents = normalizeEquivalents(steelData.equivalents);
    if (steelData.chemistery !== undefined) steelUpdates.chemistery = steelData.chemistery;
    if (steelData.elements !== undefined) steelUpdates.elements = steelData.elements;
    
    if (Object.keys(steelUpdates).length > 0) {
      await steel.steel.update(steelUpdates, { transaction: t });
    }
  });
  
  // Mettre à jour le modified_at de l'acier et de ses ancêtres après mise à jour
  await updateAncestorsModifiedAt(steelId);
  
  // Récupérer l'acier mis à jour
  const updatedSteel = await getSteelById(steelId);
  return updatedSteel;
};

/**
 * Supprime un acier
 * @param {number} steelId - ID de l'acier à supprimer
 * @returns {Promise<boolean>} Résultat de l'opération
 */
const deleteSteel = async (steelId) => {
  // Récupérer l'acier
  const steelNode = await node.findOne({
    where: { id: steelId, type: 'steel' },
    include: [{
      model: steel
    }]
  });
  
  if (!steelNode) {
    throw new NotFoundError('Acier non trouvé');
  }
  
  try {
    // Vérifier les références avant suppression
    
    // 1. Vérifier si cet acier est utilisé comme équivalent par d'autres aciers
    const steelsWithEquivalents = await steel.findAll({
      where: {
        equivalents: {
          [Op.ne]: null
        }
      },
      include: [{
        model: node,
        required: true
      }]
    });
      // Chercher si l'acier à supprimer est référencé dans les équivalents
    const referencingSteel = steelsWithEquivalents.find(s => {
      if (s.equivalents && Array.isArray(s.equivalents)) {
        return s.equivalents.some(equiv => {
          const equivalentId = equiv.steel_id || equiv.steelId || equiv.id;
          return equivalentId == steelId;
        });
      }
      return false;
    });
    
    if (referencingSteel) {
      throw new ValidationError(
        `Impossible de supprimer cet acier car il est utilisé comme équivalent par l'acier "${referencingSteel.Node.name}" (ID: ${referencingSteel.node_id}). Veuillez d'abord retirer cette référence.`
      );
    }
    
    // 2. Vérifier si cet acier est utilisé par des pièces
    // (À implémenter selon la structure de votre base de données)    // Supprimer dans une transaction
    await sequelize.transaction(async (t) => {
      // Supprimer les réciprocités avant de supprimer l'acier
      const equivalents = steel.steel.equivalents || [];
      await removeReciprocalEquivalents(steelId, equivalents, t);
      
      // 1. Supprimer les données Steel en premier (à cause de la clé étrangère)
      await steel.destroy({
        where: { node_id: steelId },
        transaction: t
      });
      
      // 2. Supprimer toutes les entrées dans la table closure où ce nœud apparaît
      const { closure: Closure } = require('../models');
      await closure.destroy({
        where: {
          [Op.or]: [
            { ancestor_id: steelId },
            { descendant_id: steelId }
          ]
        },
        transaction: t
      });
      
      // 3. Supprimer le nœud
      await steel.destroy({ transaction: t });
    });
    
    return true;
  } catch (error) {
    logger.error(`Erreur lors de la suppression de l'acier #${steelId}: ${error.message}`, error);
    throw error;  }
};

/**
 * Fonction utilitaire pour nettoyer et standardiser tous les équivalents en base
 * À utiliser pour la migration des données existantes
 * @returns {Promise<Object>} Résultat de l'opération
 */
const cleanUpEquivalents = async () => {
  try {
    logger.info('Début du nettoyage des équivalents...');
    
    const steels = await steel.findAll({
      where: {
        equivalents: {
          [Op.ne]: null
        }
      }
    });
    
    let updatedCount = 0;
    
    for (const steel of steels) {
      const normalizedEquivalents = normalizeEquivalents(steel.equivalents);
      
      // Vérifier si il y a une différence
      const originalJson = JSON.stringify(steel.equivalents);
      const normalizedJson = JSON.stringify(normalizedEquivalents);
      
      if (originalJson !== normalizedJson) {
        await sequelize.query(
          'UPDATE steels SET equivalents = ? WHERE node_id = ?',
          {
            replacements: [normalizedJson, steel.node_id],
            type: sequelize.QueryTypes.UPDATE
          }
        );
        
        updatedCount++;
        logger.info(`Acier ${steel.node_id}: ${originalJson} -> ${normalizedJson}`);
      }
    }
    
    logger.info(`Nettoyage terminé. ${updatedCount} aciers mis à jour.`);
    return { updated: updatedCount, total: steels.length };
    
  } catch (error) {
    logger.error('Erreur lors du nettoyage des équivalents:', error);
    throw error;
  }
};

module.exports = {
  getAllSteels,
  getSteelGrades,
  getSteelById,
  createSteel,
  updateSteel,
  deleteSteel,
  cleanUpEquivalents // Fonction utilitaire pour la migration
};