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
    if (hierarchyState.clientId && (currentLevel === 'order' || currentLevel === 'part' || currentLevel === 'test')) {
      items.push({
        level: 'order',
        name: `${hierarchyState.clientName} > ${t('navigation.hierarchy.requests')}`,
        active: currentLevel === 'order'
      });
    }
    
    if (hierarchyState.orderId && (currentLevel === 'part' || currentLevel === 'test')) {
      items.push({
        level: 'part',
        name: `${hierarchyState.orderName} > ${t('navigation.hierarchy.parts')}`,
        active: currentLevel === 'part'
      });
    }
    
    if (hierarchyState.partId && currentLevel === 'test') {
      items.push({
        level: 'test',
        name: `${hierarchyState.partName} > ${t('navigation.hierarchy.trials')}`,
        active: currentLevel === 'test'
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
        navigateToLevel('order', hierarchyState.clientId, hierarchyState.clientName);
        break;
      case 'part':
        navigateToLevel('part', hierarchyState.orderId, hierarchyState.orderName);
        break;
      case 'test':
        navigateToLevel('test', hierarchyState.partId, hierarchyState.partName);
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