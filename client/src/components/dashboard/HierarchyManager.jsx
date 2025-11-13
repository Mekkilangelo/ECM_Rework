// client/src/components/dashboard/HierarchyManager.jsx
import React from 'react';
import { Container } from 'react-bootstrap';
import { useNavigation } from '../../context/NavigationContext';
import Breadcrumb from '../common/Breadcrumb/Breadcrumb';
import ClientList from './clients/list/ClientList';
import TrialRequestList from './orders/list/TrialRequestList';
import PartList from './parts/list/PartList';
import TrialList from './tests/list/TrialList';
import PropTypes from 'prop-types';

const HierarchyManager = ({ onDataChanged }) => {
  const { currentLevel, hierarchyState } = useNavigation();
  
  const renderCurrentLevel = () => {
    switch (currentLevel) {
      case 'client':
        return <ClientList onDataChanged={onDataChanged} />;
      case 'trial_request':
      case 'order':  // Support ancien nom
        return <TrialRequestList onDataChanged={onDataChanged} />;
      case 'part':
        return <PartList orderId={hierarchyState.orderId} onDataChanged={onDataChanged} />;
      case 'trial':
      case 'test':  // Support ancien nom
        return <TrialList partId={hierarchyState.partId} onDataChanged={onDataChanged} />;
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