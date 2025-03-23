import api from './api';

export const cleanData = async () => {
    try {
      const response = await api.delete('/nodes/');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erreur lors du nettoyage des données' };
    }
  };