import { useState, useEffect, useRef } from 'react';
import { useNavigation } from '../context/NavigationContext';
import axios from 'axios';
import logger from '../utils/logger';

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
  
  // Extraire les IDs primitifs pour éviter les re-renders sur changement de référence d'objet
  const clientId = hierarchyState?.clientId;
  const orderId = hierarchyState?.orderId;
  const partId = hierarchyState?.partId;
  
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
        case 'trial_request':
        case 'order':  // Support ancien nom
          url = `${API_URL}/trial-requests`;
          params = { 
            parent_id: clientId, 
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
            parent_id: orderId, 
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
        case 'trial':
        case 'test':  // Support ancien nom
          url = `${API_URL}/trials`;
          params = { 
            parent_id: partId, 
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
        // Adapter la structure de données selon la nouvelle API qui utilise data au lieu de clients/trialRequests/etc.
      if (response.data && response.data.data) {
        // La nouvelle structure a les données dans response.data.data
        setData(response.data.data || []);
        setTotalItems(response.data.pagination?.total || 0);
      } else if (currentLevel === 'client') {
        // Fallback pour l'ancienne structure API
        setData(response.data.clients || []);
        setTotalItems(response.data.pagination?.total || 0);
      } else if (currentLevel === 'trial_request' || currentLevel === 'order') {
        // Fallback pour l'ancienne structure API
        setData(response.data.trialRequests || []);
        setTotalItems(response.data.pagination?.total || 0);
      } else if (currentLevel === 'part') {
        // Fallback pour l'ancienne structure API
        setData(response.data.parts || []);
        setTotalItems(response.data.pagination?.total || 0);
      } else if (currentLevel === 'trial' || currentLevel === 'test') {
        // Fallback pour l'ancienne structure API        setData(response.data.trials || []);
        setTotalItems(response.data.pagination?.total || 0);
      }
    } catch (err) {
      logger.hook.error('useHierarchy fetchData', err, { currentLevel, hierarchyState });
      setError(err.response?.data?.message || err.message || 'Une erreur est survenue lors du chargement des données');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };  // Recharger les données quand le niveau, la page, les filtres ou la recherche changent
  // Utiliser les IDs primitifs au lieu de hierarchyState pour éviter les re-renders inutiles
  useEffect(() => {
    fetchData();
  }, [currentLevel, clientId, orderId, partId, currentPage, itemsPerPage, sortBy, sortOrder, debouncedSearchQuery]);
  
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
      // Trial Requests
      'trialRequest.commercial': 'commercial',
      'trialRequest.request_date': 'request_date',
      // Parts
      'part.client_designation': 'client_designation',
      'part.reference': 'reference',
      'part.steel': 'steel',
      'part.quantity': 'quantity',
      // Trials
      'trial.load_number': 'load_number',
      'trial.test_date': 'test_date',
      'trial.location': 'location',
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
      logger.hook.error('useHierarchy updateItemStatus', err, { nodeId, currentLevel });
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