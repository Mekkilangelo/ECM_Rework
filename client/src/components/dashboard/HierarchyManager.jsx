// client/src/components/dashboard/HierarchyManager.jsx
import React from 'react';
import { Container } from 'react-bootstrap';
import { useNavigation } from '../../context/NavigationContext';
import Breadcrumb from '../common/Breadcrumb/Breadcrumb';
import ClientList from './clients/ClientList';
import OrderList from './orders/OrderList';
import PartList from './parts/PartList';
import TestList from './tests/TestList';

const HierarchyManager = () => {
  const { currentLevel } = useNavigation();
  
  const renderCurrentLevel = () => {
    switch (currentLevel) {
      case 'client':
        return <ClientList />;
      case 'order':
        return <OrderList />;
      case 'part':
        return <PartList />;
      case 'test':
        return <TestList />;
      default:
        return <ClientList />;
    }
  };
  
  return (
    <Container fluid>
      <Breadcrumb />
      {renderCurrentLevel()}
    </Container>
  );
};

export default HierarchyManager;