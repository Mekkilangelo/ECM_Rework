/**
 * Service de gestion des pièces
 * Contient la logique métier relative aux pièces
 */

const { node, part, closure, sequelize, specs_hardness, specs_ecd, steel } = require('../models');
const { Op } = require('sequelize');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { deletePhysicalDirectory } = require('../utils/fileUtils');
const { updateAncestorsModifiedAt } = require('../utils/hierarchyUtils');
const fileService = require('./fileService');
const logger = require('../utils/logger');

/**
 * Fonction utilitaire pour valider les données de la pièce
 * @param {Object} data - Données de la pièce à valider
 * @returns {Object} - Objet contenant les erreurs de validation
 */
const validatePartData = (data) => {
  const errors = {};

  // Validation des champs obligatoires
  if (!data.name || !data.name.trim()) {
    errors.name = 'validation.required.partName';
  }

  if (!data.designation || !data.designation.trim()) {
    errors.designation = 'validation.required.designation';
  }

  if (!data.parent_id) {
    errors.parent_id = 'validation.required.parentOrder';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Formate la réponse d'une pièce pour assurer une structure cohérente
 * @param {Object} partNode - Le nœud de la pièce à formater
 * @returns {Object} - La pièce avec une structure cohérente
 */
const formatPartResponse = (partNode) => {
  if (!partNode) return null;
  
  // Convertir en JSON pour pouvoir manipuler l'objet
  const formattedPart = typeof partNode.toJSON === 'function' ? partNode.toJSON() : { ...partNode };
  
  // Vérifier si part existe et le transformer pour le format attendu par le front
  if (formattedPart.part) {
    // Remonter les propriétés importantes au niveau principal pour compatibilité avec le frontend
    formattedPart.designation = formattedPart.part.designation || '';
    formattedPart.client_designation = formattedPart.part.client_designation || '';
    formattedPart.reference = formattedPart.part.reference || '';
    formattedPart.quantity = formattedPart.part.quantity || '';
    formattedPart.steel_node_id = formattedPart.part.steel_node_id || null;
    
    // Ajouter les informations de l'acier si disponibles
    if (formattedPart.part.steel) {
      formattedPart.steel = {
        node_id: formattedPart.part.steel_node_id,
        grade: formattedPart.part.steel.grade || '',
        standard: formattedPart.part.steel.standard || '',
        family: formattedPart.part.steel.family || ''
      };
    }
    
    // Regrouper les dimensions
    formattedPart.dimensions = {
      weight: {
        value: formattedPart.part.dim_weight_value || '',
        unit: formattedPart.part.dim_weight_unit || ''
      },
      rectangular: {
        length: formattedPart.part.dim_rect_length || '',
        width: formattedPart.part.dim_rect_width || '',
        height: formattedPart.part.dim_rect_height || '',
        unit: formattedPart.part.dim_rect_unit || ''
      },
      circular: {
        diameterIn: formattedPart.part.dim_circ_diameterIn || '',
        diameterOut: formattedPart.part.dim_circ_diameterOut || '',
        unit: formattedPart.part.dim_circ_unit || ''
      }
    };
    
    // Ajouter les spécifications
    formattedPart.specifications = {
      hardness: formattedPart.part.hardnessSpecs || [],
      ecd: formattedPart.part.ecdSpecs || []
    };
  }
  
  return formattedPart;
};

/**
 * Récupère toutes les pièces avec pagination et filtrage
 * @param {Object} options - Options de requête
 * @returns {Object} Pièces paginées et données de pagination
 */
const getAllParts = async ({ limit = 10, offset = 0, parent_id = null, sortBy = 'modified_at', sortOrder = 'DESC', search = null }) => {
  const whereCondition = { type: 'part' };
  
  // Si un search est fourni
  if (search) {
    whereCondition.name = { [Op.like]: `%${search}%` };
  }
  
  // Si un parent_id est fourni, rechercher les pièces associées à cette commande
  if (parent_id) {
    const orderDescendants = await closure.findAll({
      where: { ancestor_id: parent_id },
      attributes: ['descendant_id']
    });
    
    const descendantIds = orderDescendants.map(d => d.descendant_id);
    
    whereCondition.id = {
      [Op.in]: descendantIds
    };
  }
  // Mapping des champs de tri pour gérer les colonnes des tables associées
  const getOrderClause = (sortBy, sortOrder) => {
    const sortMapping = {
      'name': ['name', sortOrder],
      'client_designation': [{ model: part, as: 'part' }, 'client_designation', sortOrder],
      'reference': [{ model: part, as: 'part' }, 'reference', sortOrder],
      'steel_node_id': [{ model: part, as: 'part' }, 'steel_node_id', sortOrder],
      'quantity': [{ model: part, as: 'part' }, 'quantity', sortOrder],
      'modified_at': ['modified_at', sortOrder],
      'created_at': ['created_at', sortOrder]
    };
    
    return sortMapping[sortBy] || ['modified_at', 'DESC'];
  };
  
  const parts = await node.findAll({
    where: whereCondition,
    include: [{
      model: part,
      as: 'part',
      attributes: [
        'designation', 'client_designation', 'reference', 'quantity', 'steel_node_id',
        'dim_weight_value', 'dim_weight_unit',
        'dim_rect_length', 'dim_rect_width', 'dim_rect_height', 'dim_rect_unit',
        'dim_circ_diameterIn', 'dim_circ_diameterOut', 'dim_circ_unit'
      ],
      include: [
        {
          model: steel,
          as: 'steel',
          attributes: ['grade', 'standard', 'family']
        },
        {
          model: specs_hardness,
          as: 'hardnessSpecs',
          attributes: ['spec_id', 'name', 'min', 'max', 'unit']
        },
        {
          model: specs_ecd,
          as: 'ecdSpecs',
          attributes: ['spec_id', 'name', 'depthMin', 'depthMax', 'depthUnit', 'hardness', 'hardnessUnit']
        }
      ]
    }],
    order: [getOrderClause(sortBy, sortOrder)],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  const total = await node.count({
    where: whereCondition
  });
    // Transformer chaque pièce avec notre fonction de formatage
  const formattedParts = parts.map(part => formatPartResponse(part));
  
  return {
    parts: formattedParts,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Récupère une pièce spécifique par son ID
 * @param {number} partId - ID de la pièce
 * @returns {Object} Détails de la pièce
 */
const getPartById = async (partId) => {
  const partNode = await node.findOne({
    where: { id: partId, type: 'part' },
    include: [{
      model: part,
      as: 'part',
      attributes: { exclude: ['node_id'] },
      include: [
        {
          model: steel,
          as: 'steel',
          attributes: ['grade', 'standard', 'family']
        },
        {
          model: specs_hardness,
          as: 'hardnessSpecs',
          attributes: ['spec_id', 'name', 'min', 'max', 'unit']
        },
        {
          model: specs_ecd,
          as: 'ecdSpecs',
          attributes: ['spec_id', 'name', 'depthMin', 'depthMax', 'depthUnit', 'hardness', 'hardnessUnit']
        }
      ]
    }]
  });
  
  if (!partNode) {
    throw new NotFoundError('Pièce non trouvée');
  }
  
  return formatPartResponse(partNode);
};

/**
 * Crée une nouvelle pièce
 * @param {Object} partData - Données de la pièce
 * @returns {Object} Pièce créée
 */
const createPart = async (partData) => {
  const { 
    parent_id, 
    designation, 
    steel_node_id,
    description, 
    client_designation, 
    reference, 
    quantity,
    dim_weight_value,
    dim_weight_unit,
    dim_rect_length,
    dim_rect_width,
    dim_rect_height,
    dim_rect_unit,
    dim_circ_diameterIn,
    dim_circ_diameterOut,
    dim_circ_unit,
    hardnessSpecs,
    ecdSpecs
  } = partData;
  const name = partData.designation || null;
  
  // Validation des données
  const { isValid, errors } = validatePartData({ name, designation, parent_id });
  if (!isValid) {
    throw new ValidationError('Données de pièce invalides', errors);
  }
  
  // Vérifier si le parent existe
  const parentNode = await node.findByPk(parent_id);
  if (!parentNode) {
    throw new NotFoundError('Node parent non trouvé');
  }
  
  if (parentNode.type !== 'trial_request') {
    throw new ValidationError('Le parent doit être une demande d\'essai (trial_request)');
  }
  
  // Créer la pièce dans une transaction
  const result = await sequelize.transaction(async (t) => {
    // Créer le nœud
    const newNode = await node.create({
      name,
      path: `${parentNode.path}/${name}`,
      type: 'part',
      parent_id,
      created_at: new Date(),
      modified_at: new Date(),
      data_status: 'new',
      description
    }, { transaction: t });
      // Créer les données de la pièce
    await part.create({
      node_id: newNode.id,
      designation,
      steel_node_id,
      client_designation,
      reference,
      quantity,
      dim_weight_value,
      dim_weight_unit,
      dim_rect_length,
      dim_rect_width,
      dim_rect_height,
      dim_rect_unit,
      dim_circ_diameterIn,
      dim_circ_diameterOut,
      dim_circ_unit
    }, { transaction: t });
    
    // Créer les spécifications de dureté
    if (hardnessSpecs && Array.isArray(hardnessSpecs) && hardnessSpecs.length > 0) {
      for (const spec of hardnessSpecs) {
        await specs_hardness.create({
          part_node_id: newNode.id,
          name: spec.name,
          min: spec.min,
          max: spec.max,
          unit: spec.unit
        }, { transaction: t });
      }
    }
    
    // Créer les spécifications ECD
    if (ecdSpecs && Array.isArray(ecdSpecs) && ecdSpecs.length > 0) {
      for (const spec of ecdSpecs) {
        await specs_ecd.create({
          part_node_id: newNode.id,
          name: spec.name,
          depthMin: spec.depthMin,
          depthMax: spec.depthMax,
          depthUnit: spec.depthUnit,
          hardness: spec.hardness,
          hardnessUnit: spec.hardnessUnit
        }, { transaction: t });
      }
    }
    
    // Créer l'entrée de fermeture (auto-relation)
    await closure.create({
      ancestor_id: newNode.id,
      descendant_id: newNode.id,
      depth: 0
    }, { transaction: t });
    
    // Créer les relations de fermeture avec les ancêtres
    const parentClosures = await closure.findAll({
      where: { descendant_id: parent_id },
      transaction: t
    });
    
    for (const pc of parentClosures) {
      await closure.create({
        ancestor_id: pc.ancestor_id,
        descendant_id: newNode.id,
        depth: pc.depth + 1
      }, { transaction: t });
    }
    
    return newNode;
  });
  
  // Mettre à jour le modified_at de la pièce et de ses ancêtres après création
  await updateAncestorsModifiedAt(result.id);
  
  // Récupérer la pièce complète avec ses données associées
  const newPart = await getPartById(result.id);
  
  return newPart;
};

/**
 * Met à jour une pièce existante
 * @param {number} partId - ID de la pièce
 * @param {Object} partData - Données mises à jour de la pièce
 * @returns {Object} Pièce mise à jour
 */
const updatePart = async (partId, partData) => {
  const { 
    designation, 
    steel_node_id,
    description, 
    client_designation, 
    reference, 
    quantity,
    dim_weight_value,
    dim_weight_unit,
    dim_rect_length,
    dim_rect_width,
    dim_rect_height,
    dim_rect_unit,
    dim_circ_diameterIn,
    dim_circ_diameterOut,
    dim_circ_unit,
    hardnessSpecs,
    ecdSpecs
  } = partData;
  const name = partData.designation || null;
  
  const partNode = await node.findOne({
    where: { id: partId, type: 'part' },
    include: [{
      model: part,
      as: 'part'
    }]
  });
  
  if (!partNode) {
    throw new NotFoundError('Pièce non trouvée');
  }
  
  await sequelize.transaction(async (t) => {
    // Mettre à jour le nœud
    if (name) {
      const oldPath = partNode.path;
      const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + name;
      
      await partNode.update({
        name,
        path: newPath,
        modified_at: new Date(),
        description
      }, { transaction: t });
      
      // Si le nom a changé, mettre à jour les chemins des descendants
      if (name !== partNode.name) {
        const descendants = await closure.findAll({
          where: { 
            ancestor_id: partId,
            depth: { [Op.gt]: 0 }
          },
          transaction: t
        });
        
        for (const relation of descendants) {
          const descendant = await node.findByPk(relation.descendant_id, { transaction: t });
          const descendantPath = descendant.path.replace(oldPath, newPath);
          await descendant.update({ path: descendantPath }, { transaction: t });
        }
      }
    } else {
      // Juste mettre à jour la date de modification
      await partNode.update({
        modified_at: new Date(),
        description
      }, { transaction: t });
    }
      // Mettre à jour les données de la pièce
    const partUpdateData = {};
    if (designation !== undefined) partUpdateData.designation = designation;
    if (steel_node_id !== undefined) partUpdateData.steel_node_id = steel_node_id;
    if (client_designation !== undefined) partUpdateData.client_designation = client_designation;
    if (reference !== undefined) partUpdateData.reference = reference;
    if (quantity !== undefined) partUpdateData.quantity = quantity;
    if (dim_weight_value !== undefined) partUpdateData.dim_weight_value = dim_weight_value;
    if (dim_weight_unit !== undefined) partUpdateData.dim_weight_unit = dim_weight_unit;
    if (dim_rect_length !== undefined) partUpdateData.dim_rect_length = dim_rect_length;
    if (dim_rect_width !== undefined) partUpdateData.dim_rect_width = dim_rect_width;
    if (dim_rect_height !== undefined) partUpdateData.dim_rect_height = dim_rect_height;
    if (dim_rect_unit !== undefined) partUpdateData.dim_rect_unit = dim_rect_unit;
    if (dim_circ_diameterIn !== undefined) partUpdateData.dim_circ_diameterIn = dim_circ_diameterIn;
    if (dim_circ_diameterOut !== undefined) partUpdateData.dim_circ_diameterOut = dim_circ_diameterOut;
    if (dim_circ_unit !== undefined) partUpdateData.dim_circ_unit = dim_circ_unit;
    
    if (Object.keys(partUpdateData).length > 0) {
      await part.update(partUpdateData, {
        where: { node_id: partId },
        transaction: t
      });
    }
    
    // Mettre à jour les spécifications de dureté
    if (hardnessSpecs !== undefined) {
      // Supprimer les anciennes spécifications
      await specs_hardness.destroy({
        where: { part_node_id: partId },
        transaction: t
      });
      
      // Créer les nouvelles spécifications
      if (Array.isArray(hardnessSpecs) && hardnessSpecs.length > 0) {
        for (const spec of hardnessSpecs) {
          await specs_hardness.create({
            part_node_id: partId,
            name: spec.name,
            min: spec.min,
            max: spec.max,
            unit: spec.unit
          }, { transaction: t });
        }
      }
    }
    
    // Mettre à jour les spécifications ECD
    if (ecdSpecs !== undefined) {
      // Supprimer les anciennes spécifications
      await specs_ecd.destroy({
        where: { part_node_id: partId },
        transaction: t
      });
      
      // Créer les nouvelles spécifications
      if (Array.isArray(ecdSpecs) && ecdSpecs.length > 0) {
        for (const spec of ecdSpecs) {
          await specs_ecd.create({
            part_node_id: partId,
            name: spec.name,
            depthMin: spec.depthMin,
            depthMax: spec.depthMax,
            depthUnit: spec.depthUnit,
            hardness: spec.hardness,
            hardnessUnit: spec.hardnessUnit
          }, { transaction: t });
        }
      }
    }
  });
  
  // Mettre à jour le modified_at de la pièce et de ses ancêtres après mise à jour
  await updateAncestorsModifiedAt(partId);
  
  // Récupérer et renvoyer la pièce mise à jour
  const updatedPart = await getPartById(partId);
  
  return updatedPart;
};

/**
 * Supprime une pièce et tous ses descendants
 * @param {number} partId - ID de la pièce à supprimer
 * @returns {boolean} Succès de l'opération
 */
const deletePart = async (partId) => {
  // Créer une transaction pour assurer l'intégrité des données
  const t = await sequelize.transaction();
  
  try {
    // 1. Vérifier que la pièce existe
    const partNode = await node.findOne({
      where: { id: partId, type: 'part' },
      transaction: t
    });
    
    if (!partNode) {
      await t.rollback();
      throw new NotFoundError('Pièce non trouvée');
    }

    // Stocker le chemin physique de la pièce pour la suppression
    const partPhysicalPath = partNode.path;

    // Supprimer physiquement et logiquement tous les fichiers attachés à la pièce et ses descendants
    // Cette étape est cruciale pour nettoyer le nouveau système de stockage (FileStorageService)
    await fileService.deleteFilesRecursively(partId, t);
    
    // 2. Trouver tous les descendants dans la table closure
    const closureEntries = await closure.findAll({
      where: { ancestor_id: partId },
      transaction: t
    });
    
    // Récupérer tous les IDs des descendants (y compris le nœud lui-même)
    const descendantIds = new Set(closureEntries.map(entry => entry.descendant_id));
    descendantIds.add(parseInt(partId)); // Ajouter l'ID de la pièce elle-même
    
    // 3. Supprimer toutes les entrées de fermeture associées aux descendants
    // Supprimer d'abord où ils sont descendants ou ancêtres
    await closure.destroy({
      where: {
        [Op.or]: [
          { descendant_id: { [Op.in]: Array.from(descendantIds) } },
          { ancestor_id: { [Op.in]: Array.from(descendantIds) } }
        ]
      },
      transaction: t
    });
    
    // 4. Maintenant, supprimer tous les nœuds descendants
    await node.destroy({
      where: {
        id: { [Op.in]: Array.from(descendantIds) }
      },
      transaction: t
    });
    
    // 5. Valider toutes les modifications
    await t.commit();
    
    // NOUVELLE FONCTIONNALITÉ : Supprimer le dossier physique de la pièce
    // Cette opération se fait après la validation de la transaction pour éviter
    // de supprimer les fichiers si la transaction échoue
    // IMPORTANT: Les erreurs ici ne doivent PAS faire échouer l'opération car la transaction est déjà commitée
    try {
      const deletionResult = await deletePhysicalDirectory(partPhysicalPath);
      if (deletionResult) {
        logger.info('Dossier physique pièce supprimé', { partId });
      } else {
        logger.warn('Échec suppression dossier physique pièce', { partId });
      }
    } catch (physicalDeleteError) {
      // Log l'erreur mais ne pas faire échouer l'opération car la DB a été nettoyée
      logger.error('Erreur suppression dossier physique pièce', { 
        partId, 
        error: physicalDeleteError.message 
      });
    }
    
    return true;
  } catch (error) {
    // En cas d'erreur, annuler toutes les modifications
    // IMPORTANT: Vérifier que la transaction n'est pas déjà terminée avant le rollback
    if (!t.finished) {
      await t.rollback();
    }
    throw error;
  }
};

module.exports = {
  getAllParts,
  getPartById,
  createPart,
  updatePart,
  deletePart,
  validatePartData,
  formatPartResponse
};
