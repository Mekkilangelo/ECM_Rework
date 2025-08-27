import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '../context/NavigationContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;
if (!API_URL) {
  throw new Error('REACT_APP_API_URL is not defined!');
}

const useHierarchy = (initialSortBy = 'modified_at', initialSortOrder = 'desc') => {
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
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  // Utiliser une référence pour éviter des rendus supplémentaires
  const isFetchingRef = useRef(false);
  const debounceTimerRef = useRef(null);

  // Débounce pour la recherche
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);
  
  const fetchData = async () => {
    // Empêcher les appels simultanés
    if (isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {      let url, params;
        switch(currentLevel) {
        case 'client':
          url = `${API_URL}/clients`;
          // Convertir page en offset pour l'API
          params = { 
            offset: (currentPage - 1) * itemsPerPage, 
            limit: itemsPerPage,            sortBy: sortBy,
            sortOrder: sortOrder
          };
          // Ajouter la recherche si présente
          if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
            params.search = debouncedSearchQuery.trim();
          }
          break;
        case 'order':
          url = `${API_URL}/orders`;
          params = { 
            parent_id: hierarchyState.clientId, 
            offset: (currentPage - 1) * itemsPerPage, 
            limit: itemsPerPage,
            sortBy: sortBy,
            sortOrder: sortOrder
          };
          // Ajouter la recherche si présente
          if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
            params.search = debouncedSearchQuery.trim();
          }
          break;
        case 'part':
          url = `${API_URL}/parts`;
          params = { 
            parent_id: hierarchyState.orderId, 
            offset: (currentPage - 1) * itemsPerPage, 
            limit: itemsPerPage,
            sortBy: sortBy,
            sortOrder: sortOrder
          };
          // Ajouter la recherche si présente
          if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
            params.search = debouncedSearchQuery.trim();
          }
          break;
        case 'test':
          url = `${API_URL}/tests`;
          params = { 
            parent_id: hierarchyState.partId, 
            offset: (currentPage - 1) * itemsPerPage, 
            limit: itemsPerPage,
            sortBy: sortBy,
            sortOrder: sortOrder
          };
          // Ajouter la recherche si présente
          if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
            params.search = debouncedSearchQuery.trim();
          }
          break;
        default:
          url = `${API_URL}/clients`;
          params = { 
            offset: (currentPage - 1) * itemsPerPage, 
            limit: itemsPerPage,
            sortBy: sortBy,
            sortOrder: sortOrder
          };
          // Ajouter la recherche si présente
          if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
            params.search = debouncedSearchQuery.trim();
          }
      }
      
      const response = await axios.get(url, { params });
        // Adapter la structure de données selon la nouvelle API qui utilise data au lieu de clients/orders/etc.
      if (response.data && response.data.data) {
        // La nouvelle structure a les données dans response.data.data
        setData(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
      } else if (currentLevel === 'client') {
        // Fallback pour l'ancienne structure API
        setData(response.data.clients || []);
        setTotalItems(response.data.pagination?.total || 0);
      } else if (currentLevel === 'order') {
        // Fallback pour l'ancienne structure API
        setData(response.data.orders || []);
        setTotalItems(response.data.pagination?.total || 0);
      } else if (currentLevel === 'part') {
        // Fallback pour l'ancienne structure API
        setData(response.data.parts || []);
        setTotalItems(response.data.pagination?.total || 0);
      } else if (currentLevel === 'test') {
        // Fallback pour l'ancienne structure API        setData(response.data.tests || []);
        setTotalItems(response.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.response?.data?.message || err.message || 'Une erreur est survenue lors du chargement des données');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };  // Recharger les données quand le niveau, la page, les filtres ou la recherche changent
  useEffect(() => {
    fetchData();
  }, [currentLevel, hierarchyState.clientId, hierarchyState.orderId, 
      hierarchyState.partId, currentPage, itemsPerPage, sortBy, sortOrder, debouncedSearchQuery]);
  
  // Fonction pour gérer la recherche
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Fonction pour effacer la recherche
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Fonction pour gérer le tri
  const handleSort = (columnKey, direction) => {
    // Mapper les clés de colonnes vers les champs de base de données
    const sortMapping = {
      // Clients
      'name': 'name',
      'client.client_group': 'client_group',
      'client.country': 'country', 
      'client.city': 'city',
      // Orders
      'order.commercial': 'commercial',
      'order.order_date': 'order_date',
      // Parts
      'part.client_designation': 'client_designation',
      'part.reference': 'reference',
      'part.steel': 'steel',
      'part.quantity': 'quantity',
      // Tests
      'test.load_number': 'load_number',
      'test.test_date': 'test_date',
      'test.location': 'location',
      // Commun
      'modified_at': 'modified_at',
      'created_at': 'created_at'
    };
    
    const dbField = sortMapping[columnKey] || columnKey;
    setSortBy(dbField);
    setSortOrder(direction);
  };
  
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
  };    return {
    data,
    loading,
    error,
    totalItems,
    // Fonctions de tri
    sortBy,
    sortOrder,
    handleSort,
    // Fonctions de recherche
    searchQuery,
    handleSearch,
    clearSearch,
    // Autres fonctions
    updateItemStatus,
    refreshData: fetchData
  };
};

// Exporter useHierarchy comme exportation par défaut ET comme propriété nommée
// pour permettre son utilisation avec require()
export { useHierarchy };
export default useHierarchy;