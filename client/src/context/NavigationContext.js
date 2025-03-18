// client/src/context/NavigationContext.js
import React, { createContext, useContext, useState } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [currentLevel, setCurrentLevel] = useState('client');
  const [hierarchyState, setHierarchyState] = useState({
    clientId: null,
    clientName: null,
    orderId: null,
    orderName: null,
    partId: null,
    partName: null,
    testId: null,
    testName: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
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
      case 'order':
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
      case 'test':
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
      'test': 'part',
      'part': 'order',
      'order': 'client',
      'client': 'client' // Reste au niveau client
    };
    
    const nextLevel = levelMap[currentLevel];
    
    // Obtenir l'ID parent pour la navigation en arrière
    let parentId, parentName;
    switch(nextLevel) {
      case 'part':
        parentId = hierarchyState.orderId;
        parentName = hierarchyState.orderName;
        break;
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