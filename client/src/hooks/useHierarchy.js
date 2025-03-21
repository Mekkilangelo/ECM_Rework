import { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const useHierarchy = () => {
  const { 
    currentLevel, 
    hierarchyState, 
    currentPage, 
    itemsPerPage 
  } = useNavigation();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url, params;
      
      switch(currentLevel) {
        case 'client':
          url = `${API_URL}/clients`;
          // Convertir page en offset pour l'API
          params = { 
            offset: (currentPage - 1) * itemsPerPage, 
            limit: itemsPerPage 
          };
          break;
        case 'order':
          url = `${API_URL}/orders`;
          params = { 
            parent_id: hierarchyState.clientId, 
            offset: (currentPage - 1) * itemsPerPage, 
            limit: itemsPerPage 
          };
          break;
        case 'part':
          url = `${API_URL}/parts`;
          params = { 
            orderId: hierarchyState.orderId, 
            offset: (currentPage - 1) * itemsPerPage, 
            limit: itemsPerPage 
          };
          break;
        case 'test':
          url = `${API_URL}/tests`;
          params = { 
            partId: hierarchyState.partId, 
            offset: (currentPage - 1) * itemsPerPage, 
            limit: itemsPerPage 
          };
          break;
        default:
          url = `${API_URL}/clients`;
          params = { 
            offset: (currentPage - 1) * itemsPerPage, 
            limit: itemsPerPage 
          };
      }
      
      console.log(`Fetching data from ${url} with params:`, params);
      
      const response = await axios.get(url, { params });
      console.log('API Response:', response.data);
      
      // Adapter la structure de données selon le niveau
      if (currentLevel === 'client') {
        setData(response.data.clients || []);
        setTotalItems(response.data.pagination?.total || 0);
      } else if (currentLevel === 'order') {
        // Adapter selon la structure de la réponse pour les commandes
        setData(response.data.orders || []);
        setTotalItems(response.data.pagination?.total || 0);
      } else if (currentLevel === 'part') {
        // Adapter selon la structure de la réponse pour les pièces
        setData(response.data.parts || []);
        setTotalItems(response.data.pagination?.total || 0);
      } else if (currentLevel === 'test') {
        // Adapter selon la structure de la réponse pour les tests
        setData(response.data.tests || []);
        setTotalItems(response.data.pagination?.total || 0);
      }
      
      console.log('Parsed data:', data);
      console.log('Total items:', totalItems);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.response?.data?.message || err.message || 'Une erreur est survenue lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };
  
  // Recharger les données quand le niveau, la page ou les filtres changent
  useEffect(() => {
    console.log('useEffect triggered with:', {
      currentLevel,
      clientId: hierarchyState.clientId,
      orderId: hierarchyState.orderId,
      partId: hierarchyState.partId,
      currentPage,
      itemsPerPage
    });
    fetchData();
  }, [currentLevel, hierarchyState.clientId, hierarchyState.orderId, 
      hierarchyState.partId, currentPage, itemsPerPage]);
  
  // Mettre à jour le statut d'un élément (nouveau -> lu)
  const updateItemStatus = async (nodeId) => {
    try {
      await axios.put(`${API_URL}/nodes/${nodeId}/status`, {
        status: 'opened'
      });
      
      // Mettre à jour l'état local après succès
      setData(prevData => 
        prevData.map(item => 
          item.id === nodeId ? { ...item, data_status: 'opened' } : item
        )
      );
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
    }
  };
  
  return {
    data,
    loading,
    error,
    totalItems,
    updateItemStatus,
    refreshData: fetchData
  };
};