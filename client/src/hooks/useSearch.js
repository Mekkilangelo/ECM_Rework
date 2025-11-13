import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import searchService from '../services/searchService';
import { useTranslation } from 'react-i18next';

const useSearch = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [searchParams, setSearchParams] = useState({
    query: '',
    entityTypes: ['clients', 'orders', 'parts', 'trials', 'steels'],
    page: 1,
    limit: 20
  });

  const [advancedFilters, setAdvancedFilters] = useState({
    // Clients
    clientGroup: '',
    country: '',
    city: '',
    address: '',
    
    // Orders
    orderDate: null,
    commercial: '',
    
    // Parts
    partDesignation: '',
    clientDesignation: '',
    reference: '',
    steelType: '',
    minQuantity: '',
    maxQuantity: '',
    minLength: '',
    maxLength: '',
    minWidth: '',
    maxWidth: '',
    minHeight: '',
    maxHeight: '',
    minCoreHardness: '',
    maxCoreHardness: '',
    
    // Trials
    trialStatus: '',
    trialLocation: '',
    mountingType: '',
    processType: '',
    positionType: '',
    trialDateFrom: null,
    trialDateTo: null,
    loadNumber: '',
    furnaceType: '',
    recipeNumber: '',
    preoxMedia: '',
    
    // Steels
    steelFamily: '',
    steelStandard: '',
    steelGrade: '',
    equivalent: '',
    chemicalElement: ''
  });

  const [searchResults, setSearchResults] = useState({
    clients: [],
    orders: [],
    parts: [],
    trials: [],
    steels: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('q') || '';
    
    setSearchParams(prev => ({
      ...prev,
      query: queryParam
    }));
    
    extractFiltersFromUrl();
    
    if (queryParam || hasActiveFiltersFromUrl(params)) {
      performSearch(queryParam);
    }
  }, [location.search]);

  const hasActiveFiltersFromUrl = (params) => {
    const filterFields = Object.keys(advancedFilters);
    return filterFields.some(field => params.has(field) && params.get(field) !== '');
  };

  const extractFiltersFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const newFilters = { ...advancedFilters };
    
    Object.keys(advancedFilters).forEach(key => {
      if (params.has(key)) {
        const value = params.get(key);
        if (key.includes('Date') && value) {
          newFilters[key] = new Date(value);
        } else if (
          key.startsWith('min') || 
          key.startsWith('max') || 
          key === 'quantity'
        ) {
          newFilters[key] = value !== '' ? parseInt(value) : '';
        } else {
          newFilters[key] = value;
        }
      }
    });
    
    if (params.has('entityTypes')) {
      const entityTypes = params.get('entityTypes').split(',');
      setSearchParams(prev => ({
        ...prev,
        entityTypes
      }));
    }
    
    setAdvancedFilters(newFilters);
  };

  const performSearch = async (query = searchParams.query, page = 1) => {
    if (query.trim() === '' && !hasActiveFilters()) {
      setError(t('search.errorNoQueryOrFilter'));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let queryParams = {
        page,
        limit: searchParams.limit,
        ...getActiveFilters()
      };
      
      if (query.trim() !== '') {
        queryParams.q = query;
      }
      
      if (searchParams.entityTypes.length > 0 && searchParams.entityTypes.length < 5) {
        queryParams.entityTypes = searchParams.entityTypes.join(',');
      }
      
      const response = await searchService.search(queryParams);
      
      const filteredResults = {};
      let totalCount = 0;
      
      Object.keys(response.results || {}).forEach(entityType => {
        if (searchParams.entityTypes.includes(entityType)) {
          filteredResults[entityType] = response.results[entityType];
          totalCount += response.results[entityType].length || 0;
        }
      });
      
      setSearchResults(filteredResults);
      setTotalResults(totalCount);
      updateUrlWithFilters(query, page);
    } catch (err) {
      console.error('Error performing search:', err);
      setError(err.message || t('search.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const updateUrlWithFilters = (query, page) => {
    const params = new URLSearchParams();
    
    if (query.trim() !== '') {
      params.set('q', query);
    }
    
    if (searchParams.entityTypes.length > 0 && searchParams.entityTypes.length < 5) {
      params.set('entityTypes', searchParams.entityTypes.join(','));
    }
    
    if (page > 1) {
      params.set('page', page.toString());
    }
    
    const activeFilters = getActiveFilters();
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        if (value instanceof Date) {
          params.set(key, value.toISOString().split('T')[0]);
        } else {
          params.set(key, value.toString());
        }
      }
    });
    
    navigate(`/search?${params.toString()}`, { replace: true });
  };

  const hasActiveFilters = () => {
    return Object.entries(advancedFilters).some(([key, value]) => {
      if (value === null || value === '') return false;
      
      // Pour les champs numériques, vérifier qu'ils ne sont pas vides
      if (
        key.startsWith('min') || 
        key.startsWith('max') || 
        key === 'quantity'
      ) {
        return value !== '';
      }
      
      return true;
    });
  };

  const getActiveFilters = () => {
    const active = {};
    Object.entries(advancedFilters).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        if (value instanceof Date) {
          active[key] = value.toISOString().split('T')[0];
        } else {
          active[key] = value;
        }
      }
    });
    return active;
  };

  const handleQueryChange = (e) => {
    setSearchParams(prev => ({
      ...prev,
      query: e.target.value
    }));
  };

  const handleEntityTypeChange = (entityType) => {
    setSearchParams(prev => {
      const newTypes = prev.entityTypes.includes(entityType)
        ? prev.entityTypes.filter(type => type !== entityType)
        : [...prev.entityTypes, entityType];
      
      if (newTypes.length === 0) {
        return prev;
      }
      
      return {
        ...prev,
        entityTypes: newTypes
      };
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setAdvancedFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date, name) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [name]: date
    }));
  };

  const clearFilter = (filterName) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [filterName]: filterName.includes('Date') ? null : ''
    }));
  };

  const resetFilters = () => {
    setAdvancedFilters({
      // Clients
      clientGroup: '',
      country: '',
      city: '',
      address: '',
      
      // Orders
      orderDate: null,
      commercial: '',
      
      // Parts
      partDesignation: '',
      clientDesignation: '',
      reference: '',
      steelType: '',
      minQuantity: '',
      maxQuantity: '',
      minLength: '',
      maxLength: '',
      minWidth: '',
      maxWidth: '',
      minHeight: '',
      maxHeight: '',
      minCoreHardness: '',
      maxCoreHardness: '',
      
      // Trials
      trialStatus: '',
      trialLocation: '',
      mountingType: '',
      processType: '',
      positionType: '',
      trialDateFrom: null,
      trialDateTo: null,
      loadNumber: '',
      furnaceType: '',
      recipeNumber: '',
      preoxMedia: '',
      
      // Steels
      steelFamily: '',
      steelStandard: '',
      steelGrade: '',
      equivalent: '',
      chemicalElement: ''
    });
  };

  const calculateTotalItems = () => {
    return Object.values(searchResults).reduce((total, items) => total + (items?.length || 0), 0);
  };

  return {
    searchParams,
    advancedFilters,
    searchResults,
    loading,
    error,
    totalResults,
    performSearch,
    handleQueryChange,
    handleEntityTypeChange,
    handleFilterChange,
    handleDateChange,
    clearFilter,
    resetFilters,
    hasActiveFilters,
    getActiveFilters,
    calculateTotalItems
  };
};

export default useSearch;