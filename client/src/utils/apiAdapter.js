/**
 * Adaptateur pour normaliser les réponses API entre les anciens et nouveaux formats
 * Cela facilite l'évolution de l'API sans impacter les composants clients
 */

/**
 * Normalise une réponse API pour obtenir une structure cohérente
 * quelle que soit la version de l'API (ancienne ou nouvelle)
 * 
 * @param {Object} response - Réponse obtenue de l'API
 * @returns {Object} Réponse normalisée
 */
export const normalizeApiResponse = (response) => {
  // Si c'est une réponse formatée avec le nouveau format (avec .success)
  if (response && response.data && typeof response.data.success === 'boolean') {
    return {
      success: response.data.success,
      message: response.data.message || '',
      data: response.data.data || {},
      status: response.status,
      originalResponse: response
    };
  }
  
  // Si c'est une ancienne réponse qui retourne directement les données
  return {
    success: response.status >= 200 && response.status < 300,
    message: '',
    data: response.data,
    status: response.status,
    originalResponse: response
  };
};

/**
 * Extrait seulement les données d'une réponse API normalisée
 * 
 * @param {Object} normalizedResponse - Réponse normalisée 
 * @returns {any} Données extraites
 */
export const extractData = (normalizedResponse) => {
  return normalizedResponse.data;
};

/**
 * Extrait et lance une erreur formatée à partir d'une réponse d'erreur API
 * 
 * @param {Error} error - Erreur Axios ou autre
 * @returns {Error} Erreur formatée
 */
export const formatApiError = (error) => {
  // Si c'est une erreur de réponse Axios avec structure
  if (error.response && error.response.data) {
    // Nouvelle structure d'API
    if (typeof error.response.data.success === 'boolean') {
      const errorMessage = error.response.data.message || 'Erreur inconnue';
      const detailedErrors = error.response.data.errors || [];
      
      const formattedError = new Error(errorMessage);
      formattedError.status = error.response.status;
      formattedError.details = detailedErrors;
      
      return formattedError;
    }
    
    // Ancienne structure ou message simple
    return new Error(
      typeof error.response.data === 'string' 
        ? error.response.data 
        : JSON.stringify(error.response.data)
    );
  }
  
  // Erreur réseau ou autre
  return error;
};

export default {
  normalizeApiResponse,
  extractData,
  formatApiError
};
