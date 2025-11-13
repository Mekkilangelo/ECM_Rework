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
    orderClause = [[{ model: steel, as: 'steel' }, sortBy, sortOrder]];
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
        as: 'steel',
        attributes: ['grade', 'family', 'standard', 'chemistery', 'elements']
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
        as: 'steel',
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
      as: 'steel',
      attributes: ['grade', 'family', 'standard']
    }],
    order: [[{ model: steel, as: 'steel' }, 'grade', 'ASC']]
  });
  
  // Extraire les grades avec leur node_id pour référence FK
  const grades = steels
    .filter(node => node.steel && node.steel.grade)
    .map(node => ({
      id: node.id,           // ✅ AJOUTÉ : node_id pour FK steel_node_id
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
  logger.info(`=== getSteelById appelé avec ID: ${steelId} ===`);
  
  // Récupérer le node avec les données steel de base
  const steelNode = await node.findByPk(steelId, {
    include: [{
      model: steel,
      as: 'steel',
      attributes: ['node_id', 'grade', 'family', 'standard', 'chemistery', 'elements']
    }]
  });
  
  if (!steelNode || steelNode.type !== 'steel') {
    throw new NotFoundError('Acier non trouvé');
  }
  
  logger.info(`Node trouvé: ${steelNode.name}, type: ${steelNode.type}`);
  
  // Récupérer les équivalents depuis la table steel_equivalents avec une requête SQL brute
  if (steelNode.steel) {
    logger.info(`Recherche des équivalents pour steel_node_id = ${steelId}...`);
    
    // Récupérer les équivalents dans les DEUX directions (bidirectionnel)
    const equivalentsData = await sequelize.query(
      `SELECT DISTINCT s.node_id, s.grade, s.family, s.standard, n.id, n.name
       FROM steel_equivalents se
       INNER JOIN steels s ON (se.equivalent_steel_node_id = s.node_id OR se.steel_node_id = s.node_id)
       INNER JOIN nodes n ON s.node_id = n.id
       WHERE (se.steel_node_id = ? OR se.equivalent_steel_node_id = ?)
       AND s.node_id != ?`,
      {
        replacements: [steelId, steelId, steelId],
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    logger.info(`Résultat de la requête SQL:`, JSON.stringify(equivalentsData, null, 2));
    
    // Formater les données pour correspondre à la structure attendue
    const formattedEquivalents = equivalentsData && equivalentsData.length > 0 
      ? equivalentsData.map(eq => ({
          node_id: eq.node_id,
          grade: eq.grade,
          family: eq.family,
          standard: eq.standard,
          node: {
            id: eq.id,
            name: eq.name
          }
        }))
      : [];
    
    logger.info(`${formattedEquivalents.length} équivalent(s) trouvé(s) pour l'acier ${steelId}`);
    logger.info(`Équivalents formatés:`, JSON.stringify(formattedEquivalents, null, 2));
    
    // Convertir steelNode en objet plain et ajouter les équivalents
    const result = steelNode.toJSON();
    result.steel.equivalents = formattedEquivalents;
    
    logger.info(`Retour de getSteelById - steel.equivalents:`, result.steel.equivalents);
    return result;
  }
  
  return steelNode.toJSON();
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
    const equivalentId = equivalent.steel_id || equivalent.steelId || equivalent.id;
    
    if (equivalentId) {
      logger.info(`Ajout de la réciprocité: acier ${equivalentId} -> acier ${steelId}`);
      
      // Insérer la relation réciproque dans steel_equivalents
      await sequelize.query(
        'INSERT INTO steel_equivalents (steel_node_id, equivalent_steel_node_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE steel_node_id = VALUES(steel_node_id)',
        {
          replacements: [equivalentId, steelId],
          type: sequelize.QueryTypes.INSERT,
          transaction
        }
      );
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
      logger.info(`Suppression de la réciprocité: acier ${equivalentId} -> acier ${steelId}`);
      
      // Supprimer de la table steel_equivalents
      await sequelize.query(
        'DELETE FROM steel_equivalents WHERE steel_node_id = ? AND equivalent_steel_node_id = ?',
        {
          replacements: [equivalentId, steelId],
          type: sequelize.QueryTypes.DELETE,
          transaction
        }
      );
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
      as: 'steel',
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
      chemistery,
      elements
    }, { transaction: t });
    
    // Ajouter les équivalents dans la table steel_equivalents
    if (normalizedEquivalents && normalizedEquivalents.length > 0) {
      // Ajouter les relations directes
      for (const equivalent of normalizedEquivalents) {
        const equivalentId = equivalent.steel_id || equivalent.steelId || equivalent.id;
        if (equivalentId) {
          await sequelize.query(
            'INSERT INTO steel_equivalents (steel_node_id, equivalent_steel_node_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE steel_node_id = VALUES(steel_node_id)',
            {
              replacements: [newNode.id, equivalentId],
              type: sequelize.QueryTypes.INSERT,
              transaction: t
            }
          );
        }
      }
      // Ajouter la réciprocité
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
      model: steel,
      as: 'steel'
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
        as: 'steel',
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
  await sequelize.transaction(async (t) => {
    // Gérer les équivalents si modifiés
    if (steelData.equivalents !== undefined) {
      // Récupérer les anciens équivalents depuis la table steel_equivalents (bidirectionnel)
      const oldEquivalentsResult = await sequelize.query(
        `SELECT DISTINCT 
          CASE 
            WHEN se.steel_node_id = ? THEN se.equivalent_steel_node_id 
            ELSE se.steel_node_id 
          END as id
         FROM steel_equivalents se
         WHERE se.steel_node_id = ? OR se.equivalent_steel_node_id = ?`,
        {
          replacements: [steelId, steelId, steelId],
          type: sequelize.QueryTypes.SELECT,
          transaction: t
        }
      );
      const oldEquivalents = oldEquivalentsResult.map(row => ({ id: row.id }));
      const newEquivalents = normalizeEquivalents(steelData.equivalents || []);
      
      // Identifier les équivalents à ajouter et à supprimer
      const oldEquivalentIds = oldEquivalents.map(eq => parseInt(eq.id)).filter(id => !isNaN(id));
      
      const newEquivalentIds = newEquivalents.map(eq => {
        const id = eq.steel_id || eq.steelId || eq.id;
        return id ? parseInt(id) : null;
      }).filter(id => id !== null);
      
      // Équivalents à supprimer (présents dans l'ancien mais pas dans le nouveau)
      const equivalentsToRemove = oldEquivalents.filter(oldEq => {
        const oldId = parseInt(oldEq.id);
        return !isNaN(oldId) && !newEquivalentIds.includes(oldId);
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
      logger.info(`- À supprimer: ${equivalentsToRemove.map(eq => eq.id).join(', ')}`);
      logger.info(`- À ajouter: ${equivalentsToAdd.map(eq => eq.steel_id || eq.steelId || eq.id).join(', ')}`);
      
      // Supprimer les anciennes relations dans les DEUX sens
      if (equivalentsToRemove.length > 0) {
        for (const equiv of equivalentsToRemove) {
          // Supprimer dans les deux directions
          await sequelize.query(
            'DELETE FROM steel_equivalents WHERE (steel_node_id = ? AND equivalent_steel_node_id = ?) OR (steel_node_id = ? AND equivalent_steel_node_id = ?)',
            {
              replacements: [steelId, equiv.id, equiv.id, steelId],
              type: sequelize.QueryTypes.DELETE,
              transaction: t
            }
          );
        }
      }
      
      // Ajouter les nouvelles relations directes
      if (equivalentsToAdd.length > 0) {
        for (const equiv of equivalentsToAdd) {
          const equivalentId = equiv.steel_id || equiv.steelId || equiv.id;
          if (equivalentId) {
            await sequelize.query(
              'INSERT INTO steel_equivalents (steel_node_id, equivalent_steel_node_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE steel_node_id = VALUES(steel_node_id)',
              {
                replacements: [steelId, equivalentId],
                type: sequelize.QueryTypes.INSERT,
                transaction: t
              }
            );
          }
        }
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
      
      await steelNode.update(nodeUpdates, { transaction: t });
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
      await steelNode.steel.update(steelUpdates, { transaction: t });
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
/**
 * Vérifie l'utilisation d'un acier dans le système
 * @param {number} steelId - ID de l'acier
 * @returns {Promise<Object>} Informations sur l'utilisation
 */
const checkSteelUsage = async (steelId) => {
  const usage = {
    isUsed: false,
    totalCount: 0,
    details: []
  };
  
  // 1. Vérifier si cet acier est utilisé comme équivalent par d'autres aciers
  const equivalentReferences = await sequelize.query(
    'SELECT steel_node_id FROM steel_equivalents WHERE equivalent_steel_node_id = ?',
    {
      replacements: [steelId],
      type: sequelize.QueryTypes.SELECT
    }
  );
  
  if (equivalentReferences.length > 0) {
    usage.isUsed = true;
    usage.totalCount += equivalentReferences.length;
    usage.details.push({
      type: 'equivalent',
      table: 'steel_equivalents',
      count: equivalentReferences.length,
      message: `Utilisé comme équivalent par ${equivalentReferences.length} autre(s) acier(s)`
    });
  }
  
  // 2. Vérifier si cet acier est utilisé par des pièces
  const partReferences = await sequelize.query(
    'SELECT COUNT(*) as count FROM parts WHERE steel_node_id = ?',
    {
      replacements: [steelId],
      type: sequelize.QueryTypes.SELECT
    }
  );
  
  if (partReferences[0].count > 0) {
    usage.isUsed = true;
    usage.totalCount += partReferences[0].count;
    usage.details.push({
      type: 'part',
      table: 'parts',
      count: partReferences[0].count,
      message: `Utilisé par ${partReferences[0].count} pièce(s)`
    });
  }
  
  return usage;
};

const deleteSteel = async (steelId) => {
  // Récupérer l'acier
  const steelNode = await node.findOne({
    where: { id: steelId, type: 'steel' },
    include: [{
      model: steel,
      as: 'steel'
    }]
  });
  
  if (!steelNode) {
    throw new NotFoundError('Acier non trouvé');
  }
  
  try {
    // Vérifier les références avant suppression
    const usage = await checkSteelUsage(steelId);
    
    if (usage.isUsed) {
      const messages = usage.details.map(d => d.message).join('. ');
      throw new ValidationError(
        `Impossible de supprimer cet acier car il est utilisé dans le système. ${messages}. Veuillez d'abord retirer ces références.`
      );
    }
    
    // 2. Vérifier si cet acier est utilisé par des pièces
    // (À implémenter selon la structure de votre base de données)

    // Supprimer dans une transaction
    await sequelize.transaction(async (t) => {
      // 1. Supprimer toutes les entrées d'équivalents dans steel_equivalents
      await sequelize.query(
        'DELETE FROM steel_equivalents WHERE steel_node_id = ? OR equivalent_steel_node_id = ?',
        {
          replacements: [steelId, steelId],
          type: sequelize.QueryTypes.DELETE,
          transaction: t
        }
      );
      
      // 2. Supprimer les données Steel (à cause de la clé étrangère)
      await steel.destroy({
        where: { node_id: steelId },
        transaction: t
      });
      
      // 3. Supprimer toutes les entrées dans la table closure où ce nœud apparaît
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
      
      // 4. Supprimer le nœud
      await steelNode.destroy({ transaction: t });
    });
    
    return true;
  } catch (error) {
    logger.error(`Erreur lors de la suppression de l'acier #${steelId}: ${error.message}`, error);
    throw error;
  }
};

/**
 * Supprime un acier en forçant (retire toutes les références)
 * @param {number} steelId - ID de l'acier
 * @returns {Promise<Object>} Résultat de l'opération
 */
const forceDeleteSteel = async (steelId) => {
  // Récupérer l'acier
  const steelNode = await node.findOne({
    where: { id: steelId, type: 'steel' },
    include: [{
      model: steel,
      as: 'steel'
    }]
  });
  
  if (!steelNode) {
    throw new NotFoundError('Acier non trouvé');
  }
  
  try {
    // Vérifier l'utilisation
    const usage = await checkSteelUsage(steelId);
    
    // Supprimer dans une transaction
    await sequelize.transaction(async (t) => {
      // 1. Retirer toutes les références dans steel_equivalents
      await sequelize.query(
        'DELETE FROM steel_equivalents WHERE steel_node_id = ? OR equivalent_steel_node_id = ?',
        {
          replacements: [steelId, steelId],
          type: sequelize.QueryTypes.DELETE,
          transaction: t
        }
      );
      
      // 2. Mettre à NULL les références dans les pièces
      await sequelize.query(
        'UPDATE parts SET steel_node_id = NULL WHERE steel_node_id = ?',
        {
          replacements: [steelId],
          type: sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      
      // 3. Supprimer les données Steel
      await steel.destroy({
        where: { node_id: steelId },
        transaction: t
      });
      
      // 4. Supprimer les entrées dans la table closure
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
      
      // 5. Supprimer le nœud
      await steelNode.destroy({ transaction: t });
    });
    
    return {
      success: true,
      message: `Acier supprimé avec succès (${usage.totalCount} référence(s) retirée(s))`,
      removedReferences: usage.totalCount
    };
  } catch (error) {
    logger.error(`Erreur lors de la suppression forcée de l'acier #${steelId}: ${error.message}`, error);
    throw error;
  }
};

/**
 * Remplace toutes les références à un acier par un autre puis supprime l'ancien
 * @param {number} oldSteelId - ID de l'acier à supprimer
 * @param {number} newSteelId - ID de l'acier de remplacement
 * @returns {Promise<Object>} Résultat de l'opération
 */
const replaceSteelAndDelete = async (oldSteelId, newSteelId) => {
  // Vérifier que les deux aciers existent
  const oldSteel = await node.findOne({
    where: { id: oldSteelId, type: 'steel' },
    include: [{ model: steel, as: 'steel' }]
  });
  
  if (!oldSteel) {
    throw new NotFoundError('Acier à supprimer non trouvé');
  }
  
  const newSteel = await node.findOne({
    where: { id: newSteelId, type: 'steel' },
    include: [{ model: steel, as: 'steel' }]
  });
  
  if (!newSteel) {
    throw new NotFoundError('Acier de remplacement non trouvé');
  }
  
  if (oldSteelId === newSteelId) {
    throw new ValidationError('L\'acier de remplacement doit être différent de l\'acier à supprimer');
  }
  
  try {
    // Vérifier l'utilisation
    const usage = await checkSteelUsage(oldSteelId);
    
    // Supprimer dans une transaction
    await sequelize.transaction(async (t) => {
      // 1. Remplacer dans steel_equivalents
      await sequelize.query(
        'UPDATE steel_equivalents SET steel_node_id = ? WHERE steel_node_id = ?',
        {
          replacements: [newSteelId, oldSteelId],
          type: sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      
      await sequelize.query(
        'UPDATE steel_equivalents SET equivalent_steel_node_id = ? WHERE equivalent_steel_node_id = ?',
        {
          replacements: [newSteelId, oldSteelId],
          type: sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      
      // Supprimer les doublons potentiels
      await sequelize.query(
        'DELETE FROM steel_equivalents WHERE steel_node_id = equivalent_steel_node_id',
        {
          type: sequelize.QueryTypes.DELETE,
          transaction: t
        }
      );
      
      // 2. Remplacer dans parts
      await sequelize.query(
        'UPDATE parts SET steel_node_id = ? WHERE steel_node_id = ?',
        {
          replacements: [newSteelId, oldSteelId],
          type: sequelize.QueryTypes.UPDATE,
          transaction: t
        }
      );
      
      // 3. Supprimer toutes les références restantes à l'ancien acier dans steel_equivalents
      await sequelize.query(
        'DELETE FROM steel_equivalents WHERE steel_node_id = ? OR equivalent_steel_node_id = ?',
        {
          replacements: [oldSteelId, oldSteelId],
          type: sequelize.QueryTypes.DELETE,
          transaction: t
        }
      );
      
      // 4. Supprimer les données Steel
      await steel.destroy({
        where: { node_id: oldSteelId },
        transaction: t
      });
      
      // 5. Supprimer les entrées dans la table closure
      const { closure: Closure } = require('../models');
      await closure.destroy({
        where: {
          [Op.or]: [
            { ancestor_id: oldSteelId },
            { descendant_id: oldSteelId }
          ]
        },
        transaction: t
      });
      
      // 6. Supprimer le nœud
      await oldSteel.destroy({ transaction: t });
    });
    
    return {
      success: true,
      message: `Acier remplacé et supprimé avec succès (${usage.totalCount} référence(s) mise(s) à jour)`,
      oldSteelId,
      newSteelId,
      updatedReferences: usage.totalCount
    };
  } catch (error) {
    logger.error(`Erreur lors du remplacement de l'acier #${oldSteelId} par #${newSteelId}: ${error.message}`, error);
    throw error;
  }
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
  checkSteelUsage,
  forceDeleteSteel,
  replaceSteelAndDelete,
  cleanUpEquivalents // Fonction utilitaire pour la migration
};