import api from './api';

/**
 * Service pour gérer les communications avec le backend du chatbot
 */
const chatbotService = {
  /**
   * Envoie un message au service de chatbot
   * @param {string} message - Le message de l'utilisateur
   * @param {number} threshold - Le seuil de pertinence pour les résultats
   * @returns {Promise} - Promesse contenant la réponse du serveur
   */
  sendMessage: async (message, threshold) => {
    try {
      const response = await api.post(`/chatbot`, {
        message,
        threshold
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default chatbotService;