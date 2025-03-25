// client/src/services/hierarchyService.js
import api from './api';

import clientService from './clientService';
import orderService from './orderService';
import partService from './partService';
import testService from './testService';

export const fetchClients = async (page = 1, limit = 10) => {
  try {
    const response = await clientService.getClients(page, limit);
    return response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des clients:', error);
    throw error;
  }
};

export const fetchOrders = async (clientId, page = 1, limit = 10) => {
  try {
    const response = await orderService.getOrders(clientId, page, limit);
    return response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des commandes:', error);
    throw error;
  }
};

export const fetchParts = async (orderId, page = 1, limit = 10) => {
  try {
    const response = await partService.getParts(orderId, page, limit);
    return response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des commandes:', error);
    throw error;
  }
};

export const fetchTests = async (partId, page = 1, limit = 10) => {
  try {
    const response = await testService.getTests(partId, page, limit);
    return response.data;
  } catch (error) {
    console.error('Erreur lors du chargement des tests:', error);
    throw error;
  }
};

export const updateNodeStatus = async (nodeId, status) => {
  try {
    const response = await api.put(`${API_URL}/hierarchy/nodes/${nodeId}/status`, {
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
    const response = await api.get(`${API_URL}/${nodeType}s/${nodeId}`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors du chargement des détails du ${nodeType}:`, error);
    throw error;
  }
};