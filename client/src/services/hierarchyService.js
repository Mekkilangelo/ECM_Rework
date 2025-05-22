import api from './api';

import clientService from './clientService';
import orderService from './orderService';
import partService from './partService';
import testService from './testService';

/**
 * Service de gestion de la hiérarchie
 * Fournit des méthodes pour interagir avec la structure hiérarchique des entités
 */
const hierarchyService = {
  /**
   * Récupère la liste des clients avec pagination
   * @param {number} page - Numéro de la page (commence à 1)
   * @param {number} limit - Nombre d'éléments par page
   * @returns {Promise<Object>} Données des clients et informations de pagination
   * @throws {Error} En cas d'échec de la requête
   */
  fetchClients: async (page = 1, limit = 10) => {
    try {
      return await clientService.getClients(page, limit);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      throw error;
    }
  },

  /**
   * Récupère les commandes d'un client avec pagination
   * @param {string|number} clientId - Identifiant du client
   * @param {number} page - Numéro de la page (commence à 1)
   * @param {number} limit - Nombre d'éléments par page
   * @returns {Promise<Object>} Données des commandes et informations de pagination
   * @throws {Error} En cas d'échec de la requête
   */
  fetchOrders: async (clientId, page = 1, limit = 10) => {
    try {
      return await orderService.getOrders(clientId, page, limit);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      throw error;
    }
  },

  /**
   * Récupère les pièces d'une commande avec pagination
   * @param {string|number} orderId - Identifiant de la commande
   * @param {number} page - Numéro de la page (commence à 1)
   * @param {number} limit - Nombre d'éléments par page
   * @returns {Promise<Object>} Données des pièces et informations de pagination
   * @throws {Error} En cas d'échec de la requête
   */
  fetchParts: async (orderId, page = 1, limit = 10) => {
    try {
      return await partService.getParts(orderId, page, limit);
    } catch (error) {
      console.error('Erreur lors du chargement des pièces:', error);
      throw error;
    }
  },

  /**
   * Récupère les tests d'une pièce avec pagination
   * @param {string|number} partId - Identifiant de la pièce
   * @param {number} page - Numéro de la page (commence à 1)
   * @param {number} limit - Nombre d'éléments par page
   * @returns {Promise<Object>} Données des tests et informations de pagination
   * @throws {Error} En cas d'échec de la requête
   */
  fetchTests: async (partId, page = 1, limit = 10) => {
    try {
      return await testService.getTests(partId, page, limit);
    } catch (error) {
      console.error('Erreur lors du chargement des tests:', error);
      throw error;
    }
  },

  /**
   * Met à jour le statut d'un nœud
   * @param {string|number} nodeId - Identifiant du nœud
   * @param {string} status - Nouveau statut
   * @returns {Promise<Object>} Résultat de l'opération
   * @throws {Error} En cas d'échec de la requête
   */
  updateNodeStatus: async (nodeId, status) => {
    try {
      const response = await api.put(`/hierarchy/nodes/${nodeId}/status`, {
        status
      });
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  },

  /**
   * Récupère les détails d'un nœud
   * @param {string|number} nodeId - Identifiant du nœud
   * @param {string} nodeType - Type de nœud (client, order, part, test)
   * @returns {Promise<Object>} Détails du nœud
   * @throws {Error} En cas d'échec de la requête
   */
  fetchNodeDetails: async (nodeId, nodeType) => {
    try {
      const response = await api.get(`/${nodeType}s/${nodeId}`);
      // Traitement de la réponse selon le nouveau format d'API
      if (response.data && response.data.success === true) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du chargement des détails du ${nodeType}:`, error);
      throw error;
    }
  }
};

export default hierarchyService;