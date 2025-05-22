import api from './api';

/**
 * Service pour gérer les communications avec le backend du chatbot
 */
const chatbotService = {
  /**
   * Envoie un message au service de chatbot
   * @param {string} message - Le message de l'utilisateur
   * @param {number} threshold - Le seuil de pertinence pour les résultats
   * @returns {Promise<Object>} Réponse du chatbot contenant le message et les éventuelles données associées
   * @throws {Error} En cas d'échec de la requête
   */
  sendMessage: async (message, threshold) => {
    try {
      const response = await api.post(`/chatbot`, {
        message,
        threshold
      });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message au chatbot:', error);
      throw error;
    }
  }
};

export default chatbotService;