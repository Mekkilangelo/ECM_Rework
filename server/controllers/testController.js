/**
 * Contrôleur de gestion des tests
 * Gère les opérations CRUD sur les tests
 */

const { testService } = require('../services');
const logger = require('../utils/logger');
const apiResponse = require('../utils/apiResponse');

/**
 * Récupère tous les tests avec pagination
 * @route GET /api/tests
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Liste paginée des tests
 */
const getTests = async (req, res, next) => {
  try {
    const { limit = 10, offset = 0, search, parent_id } = req.query;
    const { sortBy, sortOrder } = req.query || { sortBy: 'modified_at', sortOrder: 'DESC' };
    
    logger.info('Récupération des tests', { 
      limit, 
      offset, 
      search,
      parent_id,
      sortBy,
      sortOrder
    });
    
    // Déléguer au service
    const result = await testService.getAllTests({
      limit,
      offset,
      search,
      parent_id,
      sortBy,
      sortOrder
    });
    
    // Renvoyer la réponse paginée
    return apiResponse.paginated(
      res,
      result.tests,
      result.pagination,
      'Tests récupérés avec succès'
    );
  } catch (error) {
    logger.error(`Erreur lors de la récupération des tests: ${error.message}`, error);
    next(error);
  }
};

/**
 * Récupère un test spécifique par son ID
 * @route GET /api/tests/:testId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Détails du test
 */
const getTestById = async (req, res, next) => {
  try {
    const { testId } = req.params;
    
    logger.info(`Récupération du test #${testId}`);
    
    // Déléguer au service
    const test = await testService.getTestById(testId);
    
    return apiResponse.success(res, test, 'Test récupéré avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération du test #${req.params.testId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Crée un nouveau test
 * @route POST /api/tests
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Test créé
 */
const createTest = async (req, res, next) => {
  try {
    const testData = req.body;
    
    logger.info("Création d'un nouveau test", { 
      parent_id: testData.parent_id,
      test_date: testData.test_date 
    });
    
    // Déléguer au service
    const newTest = await testService.createTest(testData);
    
    return apiResponse.success(
      res, 
      newTest, 
      'Test créé avec succès',
      201
    );
  } catch (error) {
    logger.error(`Erreur lors de la création du test: ${error.message}`, error);
    next(error);
  }
};

/**
 * Met à jour un test existant
 * @route PUT /api/tests/:testId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Test mis à jour
 */
const updateTest = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const testData = req.body;
    
    logger.info(`Mise à jour du test #${testId}`);
    
    // Déléguer au service
    const updatedTest = await testService.updateTest(testId, testData);
    
    return apiResponse.success(res, updatedTest, 'Test mis à jour avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du test #${req.params.testId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Supprime un test
 * @route DELETE /api/tests/:testId
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Confirmation de suppression
 */
const deleteTest = async (req, res, next) => {
  try {
    const { testId } = req.params;
    
    logger.info(`Suppression du test #${testId}`);
    
    // Déléguer au service
    await testService.deleteTest(testId);
    
    return apiResponse.success(res, { deletedId: testId }, 'Test supprimé avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la suppression du test #${req.params.testId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Récupère les données pour le rapport de test
 * @route GET /api/tests/:testId/report
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Données du rapport
 */
const getTestReportData = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { sections } = req.query;
    
    // Analyser les sections demandées
    let selectedSections;
    try {
      selectedSections = typeof sections === 'string' ? JSON.parse(sections) : sections;
    } catch (parseError) {
      logger.error("Erreur lors de l'analyse des sections:", parseError);
      return apiResponse.error(res, 'Format de sections invalide', 400);
    }
    
    logger.info(`Récupération des données de rapport pour le test #${testId}`, { sections: selectedSections });
    
    // Déléguer au service
    const reportData = await testService.getTestReportData(testId, selectedSections);
    
    return apiResponse.success(res, reportData, 'Données de rapport récupérées avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération des données de rapport pour le test #${req.params.testId}: ${error.message}`, error);
    next(error);
  }
};

/**
 * Récupère les spécifications d'un test spécifique
 * @route GET /api/tests/:testId/specs
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Middleware suivant
 * @returns {Object} Spécifications du test
 */
const getTestSpecs = async (req, res, next) => {
  try {
    const { testId } = req.params;
    
    logger.info(`Récupération des spécifications du test #${testId}`);
    
    // Déléguer au service
    const specs = await testService.getTestSpecs(testId);
    
    return apiResponse.success(res, specs, 'Spécifications du test récupérées avec succès');
  } catch (error) {
    logger.error(`Erreur lors de la récupération des spécifications du test #${req.params.testId}: ${error.message}`, error);
    next(error);
  }
};

module.exports = {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  getTestReportData,
  getTestSpecs
};
