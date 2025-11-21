/**
 * Contrôleur pour la génération de rapports
 * Gère les requêtes HTTP liées aux rapports de trials
 */

const reportService = require('../services/reportService');
const logger = require('../utils/logger');

/**
 * Génère les données d'un rapport de trial
 * @route GET /api/reports/trials/:trialId
 */
const getTrialReportData = async (req, res) => {
  try {
    const { trialId } = req.params;
    const { sections } = req.query;
    
    logger.info(`Génération rapport trial #${trialId}`, { 
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

    const reportData = await reportService.getTrialReportData(trialId, parsedSections);

    // Log pour déboguer le process_type envoyé au client
    logger.info('📤 Données envoyées au client:', {
      trialId,
      process_type: reportData.trialData?.process_type,
      processTypeRef: reportData.trialData?.processTypeRef?.name,
      hasTrialData: !!reportData.trialData
    });

    return res.status(200).json({
      success: true,
      data: reportData
    });

  } catch (error) {
    logger.error('Erreur génération rapport', { 
      trialId: req.params.trialId, 
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
  getTrialReportData
};
