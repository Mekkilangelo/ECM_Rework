// client/src/context/NavigationContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const NavigationContext = createContext();

// Clé pour le sessionStorage
const NAVIGATION_STATE_KEY = 'navigationState';

// Fonction pour charger l'état depuis sessionStorage
const loadNavigationState = () => {
  try {
    const saved = sessionStorage.getItem(NAVIGATION_STATE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'état de navigation:', error);
  }
  return null;
};

// Fonction pour sauvegarder l'état dans sessionStorage
const saveNavigationState = (state) => {
  try {
    sessionStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'état de navigation:', error);
  }
};

export const NavigationProvider = ({ children }) => {
  // Charger l'état sauvegardé ou utiliser les valeurs par défaut
  const savedState = loadNavigationState();
  
  const [currentLevel, setCurrentLevel] = useState(savedState?.currentLevel || 'client');
  const [hierarchyState, setHierarchyState] = useState(savedState?.hierarchyState || {
    clientId: null,
    clientName: null,
    orderId: null,
    orderName: null,
    partId: null,
    partName: null,
    testId: null,
    testName: null,
  });
  const [currentPage, setCurrentPage] = useState(savedState?.currentPage || 1);
  const [itemsPerPage, setItemsPerPage] = useState(savedState?.itemsPerPage || 10);


  // Sauvegarder l'état à chaque changement
  useEffect(() => {
    saveNavigationState({
      currentLevel,
      hierarchyState,
      currentPage,
      itemsPerPage
    });
  }, [currentLevel, hierarchyState, currentPage, itemsPerPage]);
  
  const navigateToLevel = (level, nodeId, nodeName) => {
    const newState = { ...hierarchyState };
    
    // Réinitialiser les niveaux inférieurs
    switch(level) {
      case 'client':
        newState.clientId = null;
        newState.clientName = null;
        newState.orderId = null;
        newState.orderName = null;
        newState.partId = null;
        newState.partName = null;
        newState.testId = null;
        newState.testName = null;
        break;
      case 'trial_request':
      case 'order':  // Support des deux noms pour compatibilité
        newState.clientId = nodeId;
        newState.clientName = nodeName;
        newState.orderId = null;
        newState.orderName = null;
        newState.partId = null;
        newState.partName = null;
        newState.testId = null;
        newState.testName = null;
        break;
      case 'part':
        newState.orderId = nodeId;
        newState.orderName = nodeName;
        newState.partId = null;
        newState.partName = null;
        newState.testId = null;
        newState.testName = null;
        break;
      case 'trial':
      case 'test':  // Support des deux noms pour compatibilité
        newState.partId = nodeId;
        newState.partName = nodeName;
        newState.testId = null;
        newState.testName = null;
        break;
      default:
        break;
    }
    
    setHierarchyState(newState);
    setCurrentLevel(level);
    setCurrentPage(1); // Réinitialiser à la première page
  };
  
  const navigateBack = () => {
    const levelMap = {
      'trial': 'part',
      'test': 'part',  // Support ancien nom
      'part': 'trial_request',
      'trial_request': 'client',
      'order': 'client',  // Support ancien nom
      'client': 'client' // Reste au niveau client
    };
    
    const nextLevel = levelMap[currentLevel];
    
    // Obtenir l'ID parent pour la navigation en arrière
    let parentId, parentName;
    switch(nextLevel) {
      case 'trial':
      case 'test':
        parentId = hierarchyState.partId;
        parentName = hierarchyState.partName;
        break;
      case 'part':
        parentId = hierarchyState.orderId;
        parentName = hierarchyState.orderName;
        break;
      case 'trial_request':
      case 'order':
        parentId = hierarchyState.clientId;
        parentName = hierarchyState.clientName;
        break;
      default:
        parentId = null;
        parentName = null;
    }
    
    navigateToLevel(nextLevel, parentId, parentName);
  };
  
  return (
    <NavigationContext.Provider 
      value={{ 
        currentLevel, 
        hierarchyState, 
        currentPage,
        itemsPerPage,
        setCurrentPage,
        setItemsPerPage,
        navigateToLevel,
        navigateBack
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);