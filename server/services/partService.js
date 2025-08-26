/**
 * Service de gestion des pièces
 * Contient la logique métier relative aux pièces
 */

const { node, part, closure, sequelize } = require('../models');
const { Op } = require('sequelize');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { deletePhysicalDirectory } = require('../utils/fileUtils');
const { updateAncestorsModifiedAt } = require('../utils/hierarchyUtils');

/**
 * Fonction utilitaire pour valider les données de la pièce
 * @param {Object} data - Données de la pièce à valider
 * @returns {Object} - Objet contenant les erreurs de validation
 */
const validatePartData = (data) => {
  const errors = {};
  
  // Validation des champs obligatoires
  if (!data.name || !data.name.trim()) {
    errors.name = 'Le nom est requis';
  }
  
  if (!data.designation || !data.designation.trim()) {
    errors.designation = 'La désignation est requise';
  }
  
  if (!data.parent_id) {
    errors.parent = 'ID parent est requis';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Formate la réponse d'une pièce pour assurer une structure cohérente
 * @param {Object} part - La pièce à formater
 * @returns {Object} - La pièce avec une structure cohérente
 */
const formatPartResponse = (part) => {
  if (!part) return null;
  
  // Convertir en JSON pour pouvoir manipuler l'objet
  const formattedPart = typeof part.toJSON === 'function' ? part.toJSON() : { ...part };
  
  // Vérifier si Part existe et le transformer pour le format attendu par le front
  if (formattedPart.Part) {
    // Traiter dimensions et specifications
    let dimensions = formattedPart.Part.dimensions;
    if (typeof dimensions === 'string') {
      try {
        dimensions = JSON.parse(dimensions);
      } catch (error) {
        dimensions = {};
      }
    }
    
    let specifications = formattedPart.Part.specifications;
    if (typeof specifications === 'string') {
      try {
        specifications = JSON.parse(specifications);
      } catch (error) {
        specifications = {};
      }
    }
    
    // Remonter les propriétés importantes au niveau principal pour compatibilité avec le frontend
    formattedPart.name = formattedPart.name || '';
    formattedPart.designation = formattedPart.Part.designation || '';
    formattedPart.client_designation = formattedPart.Part.client_designation || '';
    formattedPart.reference = formattedPart.Part.reference || '';
    formattedPart.quantity = formattedPart.Part.quantity || '';
    formattedPart.steel = formattedPart.Part.steel || '';
    formattedPart.dimensions = dimensions || {};
    formattedPart.specifications = specifications || {};
    formattedPart.description = formattedPart.description || '';
    
    // Mettre à jour Part avec les valeurs parsées
    formattedPart.Part.dimensions = dimensions;
    formattedPart.Part.specifications = specifications;
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
      'client_designation': [{ model: part }, 'client_designation', sortOrder],
      'reference': [{ model: part }, 'reference', sortOrder],
      'steel': [{ model: part }, 'steel', sortOrder],
      'quantity': [{ model: part }, 'quantity', sortOrder],
      'modified_at': ['modified_at', sortOrder],
      'created_at': ['created_at', sortOrder]
    };
    
    return sortMapping[sortBy] || ['modified_at', 'DESC'];
  };
  
  const parts = await node.findAll({
    where: whereCondition,
    include: [{
      model: part,
      attributes: ['designation', 'client_designation', 'dimensions', 'specifications', 'steel', 'reference', 'quantity']
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
      attributes: { exclude: ['node_id'] }
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
    dimensions, 
    specifications, 
    steel, 
    description, 
    clientDesignation, 
    reference, 
    quantity 
  } = partData;
  const name = partData.designation || null;
  // Traitement des objets dimensions et specifications
  const formattedDimensions = typeof dimensions === 'string' 
    ? dimensions 
    : JSON.stringify(dimensions || {});
  
  const formattedSpecifications = typeof specifications === 'string'
    ? specifications
    : JSON.stringify(specifications || {});
    
  // Assurons-nous que les valeurs soient bien des objets JSON valides
  try {
    // Vérifier si dimensions est un objet JSON valide
    if (typeof formattedDimensions === 'string') {
      JSON.parse(formattedDimensions);
    }
    
    // Vérifier si specifications est un objet JSON valide
    if (typeof formattedSpecifications === 'string') {
      JSON.parse(formattedSpecifications);
    }
  } catch (error) {
    throw new ValidationError('Format JSON invalide pour dimensions ou spécifications', {
      dimensions: typeof dimensions === 'string' ? 'Format JSON invalide' : null,
      specifications: typeof specifications === 'string' ? 'Format JSON invalide' : null
    });
  }
  
  // Validation des données
  const { isValid, errors } = validatePartData({ name, designation, parent_id });
  if (!isValid) {
    throw new ValidationError('Données de pièce invalides', errors);
  }
  
  // Vérifier si le parent existe et est une commande
  const parentNode = await node.findByPk(parent_id);
  if (!parentNode) {
    throw new NotFoundError('Node parent non trouvé');
  }
  
  if (parentNode.type !== 'order') {
    throw new ValidationError('Le parent doit être une commande');
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
      dimensions: formattedDimensions,
      specifications: formattedSpecifications,
      steel,
      client_designation: clientDesignation,
      reference,
      quantity
    }, { transaction: t });
    
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
  // Utiliser getPartById pour profiter de la même transformation des données
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
    dimensions, 
    specifications, 
    steel, 
    description, 
    clientDesignation, 
    reference, 
    quantity 
  } = partData;
  const name = partData.designation || null;
    // Traitement des objets dimensions et specifications
  const formattedDimensions = typeof dimensions === 'string' 
    ? dimensions 
    : dimensions ? JSON.stringify(dimensions) : undefined;
  
  const formattedSpecifications = typeof specifications === 'string'
    ? specifications
    : specifications ? JSON.stringify(specifications) : undefined;
    
  // Assurons-nous que les valeurs soient bien des objets JSON valides s'ils sont définis
  try {
    // Vérifier si dimensions est un objet JSON valide
    if (typeof formattedDimensions === 'string') {
      JSON.parse(formattedDimensions);
    }
    
    // Vérifier si specifications est un objet JSON valide
    if (typeof formattedSpecifications === 'string') {
      JSON.parse(formattedSpecifications);
    }
  } catch (error) {
    throw new ValidationError('Format JSON invalide pour dimensions ou spécifications', {
      dimensions: formattedDimensions !== undefined ? 'Format JSON invalide' : null,
      specifications: formattedSpecifications !== undefined ? 'Format JSON invalide' : null
    });
  }
  
  const partNode = await node.findOne({
    where: { id: partId, type: 'part' },
    include: [{
      model: part
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
    if (formattedDimensions !== undefined) partUpdateData.dimensions = formattedDimensions;
    if (formattedSpecifications !== undefined) partUpdateData.specifications = formattedSpecifications;
    if (steel !== undefined) partUpdateData.steel = steel;
    if (clientDesignation !== undefined) partUpdateData.client_designation = clientDesignation;
    if (reference !== undefined) partUpdateData.reference = reference;
    if (quantity !== undefined) partUpdateData.quantity = quantity;
    
    if (Object.keys(partUpdateData).length > 0) {
      await part.update(partUpdateData, {
        where: { node_id: partId },
        transaction: t
      });
    }
  });
  
  // Mettre à jour le modified_at de la pièce et de ses ancêtres après mise à jour
  await updateAncestorsModifiedAt(partId);
  
  // Récupérer et renvoyer la pièce mise à jour
  // Utiliser getPartById pour profiter de la même transformation des données
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
    try {
      const deletionResult = await deletePhysicalDirectory(partPhysicalPath);
      if (deletionResult) {
        console.log(`Dossier physique de la pièce ${partId} supprimé avec succès`);
      } else {
        console.warn(`Échec de la suppression du dossier physique de la pièce ${partId}`);
      }
    } catch (physicalDeleteError) {
      // Log l'erreur mais ne pas faire échouer l'opération car la DB a été nettoyée
      console.error(`Erreur lors de la suppression du dossier physique de la pièce ${partId}:`, physicalDeleteError);
    }
    
    return true;
  } catch (error) {
    // En cas d'erreur, annuler toutes les modifications
    await t.rollback();
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
