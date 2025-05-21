/**
 * Service de gestion des aciers
 * Contient la logique métier liée aux opérations sur les aciers
 */

const { Steel } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');
const { validateSteelData } = require('../utils/validators');
const { 
  NotFoundError, 
  ValidationError 
} = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Récupère tous les aciers avec pagination et filtrage
 * @param {Object} options - Options de pagination et filtrage
 * @returns {Promise<Object>} Liste paginée des aciers
 */
const getAllSteels = async (options = {}) => {
  const { 
    limit = 10, 
    offset = 0, 
    sortBy = 'grade', 
    sortOrder = 'ASC',
    search = null,
    filter = null
  } = options;
  
  const whereCondition = {};
  
  // Recherche textuelle
  if (search) {
    whereCondition[Op.or] = [
      { grade: { [Op.like]: `%${search}%` } },
      { name: { [Op.like]: `%${search}%` } },
      { standard: { [Op.like]: `%${search}%` } }
    ];
  }
  
  // Filtrage par propriétés
  if (filter) {
    if (filter.grade) {
      whereCondition.grade = filter.grade;
    }
    if (filter.standard) {
      whereCondition.standard = filter.standard;
    }
    if (filter.category) {
      whereCondition.category = filter.category;
    }
  }
  
  // Exécuter la requête
  const steels = await Steel.findAll({
    where: whereCondition,
    order: [[sortBy, sortOrder]],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
  
  // Compter le total pour la pagination
  const total = await Steel.count({
    where: whereCondition
  });
  
  return {
    steels,
    pagination: {
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  };
};

/**
 * Récupère toutes les nuances d'acier distinctes
 * @returns {Promise<Array>} Liste des nuances d'acier
 */
const getSteelGrades = async () => {
  const grades = await Steel.findAll({
    attributes: [
      [sequelize.fn('DISTINCT', sequelize.col('grade')), 'grade'],
      'category',
      'standard'
    ],
    order: [['grade', 'ASC']]
  });
  
  return grades;
};

/**
 * Récupère un acier par son ID
 * @param {number} steelId - ID de l'acier
 * @returns {Promise<Object>} Détails de l'acier
 */
const getSteelById = async (steelId) => {
  const steel = await Steel.findByPk(steelId);
  
  if (!steel) {
    throw new NotFoundError('Acier non trouvé');
  }
  
  return steel;
};

/**
 * Crée un nouvel acier
 * @param {Object} steelData - Données de l'acier
 * @returns {Promise<Object>} Acier créé
 */
const createSteel = async (steelData) => {
  // Validation des données (à implémenter dans les validators)
  // const validationResult = validateSteelData(steelData);
  // if (!validationResult.isValid) {
  //   throw new ValidationError('Données d\'acier invalides', validationResult.errors);
  // }
  
  // Vérifier si la nuance existe déjà
  const existingSteel = await Steel.findOne({
    where: {
      grade: steelData.grade,
      standard: steelData.standard
    }
  });
  
  if (existingSteel) {
    throw new ValidationError('Cette nuance d\'acier existe déjà dans ce standard');
  }
  
  try {
    // Créer l'acier
    const steel = await Steel.create({
      ...steelData,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    return steel;
  } catch (error) {
    logger.error(`Erreur lors de la création de l'acier: ${error.message}`, error);
    throw error;
  }
};

/**
 * Met à jour un acier existant
 * @param {number} steelId - ID de l'acier
 * @param {Object} steelData - Nouvelles données
 * @returns {Promise<Object>} Acier mis à jour
 */
const updateSteel = async (steelId, steelData) => {
  // Récupérer l'acier existant
  const steel = await Steel.findByPk(steelId);
  
  if (!steel) {
    throw new NotFoundError('Acier non trouvé');
  }
  
  // Vérifier si la mise à jour crée un doublon de nuance/standard
  if (steelData.grade && steelData.standard) {
    const existingSteel = await Steel.findOne({
      where: {
        id: { [Op.ne]: steelId },
        grade: steelData.grade,
        standard: steelData.standard
      }
    });
    
    if (existingSteel) {
      throw new ValidationError('Cette nuance d\'acier existe déjà dans ce standard');
    }
  }
  
  try {
    // Mettre à jour l'acier
    const updates = {
      ...steelData,
      updated_at: new Date()
    };
    
    await steel.update(updates);
    
    // Récupérer l'acier mis à jour
    const updatedSteel = await getSteelById(steelId);
    return updatedSteel;
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de l'acier #${steelId}: ${error.message}`, error);
    throw error;
  }
};

/**
 * Supprime un acier
 * @param {number} steelId - ID de l'acier à supprimer
 * @returns {Promise<boolean>} Résultat de l'opération
 */
const deleteSteel = async (steelId) => {
  // Récupérer l'acier
  const steel = await Steel.findByPk(steelId);
  
  if (!steel) {
    throw new NotFoundError('Acier non trouvé');
  }
  
  try {
    // Vérifier les références avant suppression
    // (À implémenter: vérification des pièces utilisant cet acier)
    
    // Supprimer l'acier
    await steel.destroy();
    return true;
  } catch (error) {
    logger.error(`Erreur lors de la suppression de l'acier #${steelId}: ${error.message}`, error);
    throw error;
  }
};

module.exports = {
  getAllSteels,
  getSteelGrades,
  getSteelById,
  createSteel,
  updateSteel,
  deleteSteel
};