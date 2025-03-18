// client/src/hooks/useHierarchy.js
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
          params = { page: currentPage, limit: itemsPerPage };
          break;
        case 'order':
          url = `${API_URL}/orders`;
          params = { 
            clientId: hierarchyState.clientId, 
            page: currentPage, 
            limit: itemsPerPage 
          };
          break;
        case 'part':
          url = `${API_URL}/parts`;
          params = { 
            orderId: hierarchyState.orderId, 
            page: currentPage, 
            limit: itemsPerPage 
          };
          break;
        case 'test':
          url = `${API_URL}/tests`;
          params = { 
            partId: hierarchyState.partId, 
            page: currentPage, 
            limit: itemsPerPage 
          };
          break;
        default:
          url = `${API_URL}/clients`;
          params = { page: currentPage, limit: itemsPerPage };
      }
      
      const response = await axios.get(url, { params });
      
      setData(response.data.items || []);
      setTotalItems(response.data.total || 0);
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors du chargement des données');
      console.error('Erreur lors du chargement des données:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Recharger les données quand le niveau, la page ou les filtres changent
  useEffect(() => {
    fetchData();
  }, [currentLevel, hierarchyState.clientId, hierarchyState.orderId, 
      hierarchyState.partId, currentPage, itemsPerPage]);
  
  // Mettre à jour le statut d'un élément (nouveau -> lu)
  const updateItemStatus = async (nodeId) => {
    try {
      await axios.put(`${API_URL}/hierarchy/nodes/${nodeId}/status`, {
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
    refresh: fetchData
  };
};