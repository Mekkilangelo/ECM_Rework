// client/src/components/common/Breadcrumb.jsx
import React from 'react';
import { Breadcrumb as BootstrapBreadcrumb } from 'react-bootstrap';
import { useNavigation } from '../../../context/NavigationContext';
import { useTranslation } from 'react-i18next';

const Breadcrumb = () => {
  const { currentLevel, hierarchyState, navigateToLevel } = useNavigation();
  const { t } = useTranslation();
  
  const getBreadcrumbItems = () => {
    const items = [];
    
    // Toujours ajouter le niveau client
    items.push({
      level: 'client',
      name: t('navigation.hierarchy.clients'),
      active: currentLevel === 'client'
    });
    
    // Ajouter les niveaux suivants si nécessaire
    const isOrderLevel = currentLevel === 'trial_request' || currentLevel === 'order';
    const isPartLevel = currentLevel === 'part';
    const isTrialLevel = currentLevel === 'trial' || currentLevel === 'test';
    
    if (hierarchyState.clientId && (isOrderLevel || isPartLevel || isTrialLevel)) {
      items.push({
        level: 'order',
        name: `${hierarchyState.clientName} > ${t('navigation.hierarchy.requests')}`,
        active: isOrderLevel
      });
    }
    
    if (hierarchyState.orderId && (isPartLevel || isTrialLevel)) {
      items.push({
        level: 'part',
        name: `${hierarchyState.orderName} > ${t('navigation.hierarchy.parts')}`,
        active: isPartLevel
      });
    }
    
    if (hierarchyState.partId && isTrialLevel) {
      items.push({
        level: 'trial',
        name: `${hierarchyState.partName} > ${t('navigation.hierarchy.trials')}`,
        active: isTrialLevel
      });
    }
    
    return items;
  };
  
  const handleClick = (level, isActive) => {
    if (isActive) return;
    
    switch(level) {
      case 'client':
        navigateToLevel('client', null, null);
        break;
      case 'order':
        navigateToLevel('trial_request', hierarchyState.clientId, hierarchyState.clientName);
        break;
      case 'part':
        navigateToLevel('part', hierarchyState.orderId, hierarchyState.orderName);
        break;
      case 'trial':
        navigateToLevel('trial', hierarchyState.partId, hierarchyState.partName);
        break;
      default:
        break;
    }
  };
  
  return (
    <BootstrapBreadcrumb className="mb-3">
      {getBreadcrumbItems().map((item, index) => (
        <BootstrapBreadcrumb.Item 
          key={item.level}
          active={item.active}
          onClick={() => handleClick(item.level, item.active)}
          style={{ cursor: item.active ? 'default' : 'pointer' }}
        >
          {item.name}
        </BootstrapBreadcrumb.Item>
      ))}
    </BootstrapBreadcrumb>
  );
};

export default Breadcrumb;