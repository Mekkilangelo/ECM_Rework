// client/src/components/dashboard/HierarchyManager.jsx
import React from 'react';
import { Container } from 'react-bootstrap';
import { useNavigation } from '../../context/NavigationContext';
import Breadcrumb from '../common/Breadcrumb/Breadcrumb';
import ClientList from './clients/ClientList';
import OrderList from './orders/OrderList';
import PartList from './parts/PartList';
import TestList from './tests/TestList';
import PropTypes from 'prop-types';

const HierarchyManager = ({ onDataChanged }) => {
  const { currentLevel, hierarchyState } = useNavigation();
  
  const renderCurrentLevel = () => {
    switch (currentLevel) {
      case 'client':
        return <ClientList onDataChanged={onDataChanged} />;
      case 'order':
        return <OrderList onDataChanged={onDataChanged} />;
      case 'part':
        return <PartList orderId={hierarchyState.orderId} onDataChanged={onDataChanged} />;
      case 'test':
        return <TestList partId={hierarchyState.partId} onDataChanged={onDataChanged} />;
      default:
        return <ClientList onDataChanged={onDataChanged} />;
    }
  };
  
  return (
    <Container fluid>
      <Breadcrumb />
      {renderCurrentLevel()}
    </Container>
  );
};

HierarchyManager.propTypes = {
  onDataChanged: PropTypes.func
};

export default HierarchyManager;