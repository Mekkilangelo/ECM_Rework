// client/src/services/hierarchyService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const fetchClients = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/clients`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des clients:', error);
    throw error;
  }
};

export const fetchOrders = async (clientId, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/orders`, {
      params: { clientId, page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des commandes:', error);
    throw error;
  }
};

export const fetchParts = async (orderId, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/parts`, {
      params: { orderId, page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des pièces:', error);
    throw error;
  }
};

export const fetchTests = async (partId, page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/tests`, {
      params: { partId, page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des tests:', error);
    throw error;
  }
};

export const updateNodeStatus = async (nodeId, status) => {
  try {
    const response = await axios.put(`${API_URL}/hierarchy/nodes/${nodeId}/status`, {
      status
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
};

export const fetchNodeDetails = async (nodeId, nodeType) => {
  try {
    const response = await axios.get(`${API_URL}/${nodeType}s/${nodeId}`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors du chargement des détails du ${nodeType}:`, error);
    throw error;
  }
};