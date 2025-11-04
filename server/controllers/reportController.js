/**
 * Contrôleur pour la génération de rapports
 * Gère les requêtes HTTP liées aux rapports de tests
 */

const reportService = require('../services/reportService');
const logger = require('../utils/logger');

/**
 * Génère les données d'un rapport de test
 * @route GET /api/reports/tests/:testId
 */
const getTestReportData = async (req, res) => {
  try {
    const { testId } = req.params;
    const { sections } = req.query;
    
    logger.info(`Génération rapport test #${testId}`, { 
      sections: sections ? JSON.parse(sections) : [] 
    });

    // Parser les sections si fourni en tant que string JSON
    let parsedSections = [];
    if (sections) {
      try {
        parsedSections = typeof sections === 'string' ? JSON.parse(sections) : sections;
      } catch (parseError) {
        logger.warn('Erreur parsing sections', { error: parseError.message });
      }
    }

    const reportData = await reportService.getTestReportData(testId, parsedSections);

    return res.status(200).json({
      success: true,
      data: reportData
    });

  } catch (error) {
    logger.error('Erreur génération rapport', { 
      testId: req.params.testId, 
      error: error.message 
    });

    if (error.name === 'NotFoundError') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du rapport',
      error: error.message
    });
  }
};

module.exports = {
  getTestReportData
};
