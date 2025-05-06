import React from 'react';
import Layout from '../components/layout/Layout';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { NavigationProvider, useNavigation } from '../context/NavigationContext';
import HierarchyManager from '../components/dashboard/HierarchyManager';
import { useHierarchy } from '../hooks/useHierarchy';
import { useTranslation } from 'react-i18next';
import LimitSelector from '../components/common/LimitSelector';
import Pagination from '../components/common/Pagination';

// Composant Dashboard qui utilise les hooks
const DashboardContent = () => {
  const { t } = useTranslation();
  const { currentLevel, hierarchyState, currentPage, itemsPerPage, setItemsPerPage, setCurrentPage, navigateBack } = useNavigation();
  const { totalItems } = useHierarchy();
  
  // Calculer le nombre de pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Déterminer si on affiche le bouton de retour
  const showBackButton = currentLevel !== 'client';
  
  // Gérer le changement de limite d'éléments par page
  const handleLimitChange = (newLimit) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Réinitialiser à la première page lors du changement de limite
  };
  
  // Gérer le clic sur le bouton de retour
  const handleBackClick = () => {
    navigateBack();
  };
  
  return (
    <Layout>
      <Container fluid>
        <Row>
          <Col>
            {/* Contrôles de pagination */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <LimitSelector 
                itemsPerPage={itemsPerPage} 
                onLimitChange={handleLimitChange} 
                totalItems={totalItems}
              />
              
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>

            {/* Gestionnaire de hiérarchie */}
            <HierarchyManager />

            {/* Bouton de retour */}
            {showBackButton && (
              <Button 
                id="back-button" 
                variant="secondary"
                className="me-6 mb-3 mt-3"
                onClick={handleBackClick}
              >
                <FontAwesomeIcon icon={faChevronLeft} className="me-2" />
                {t('common.back')}
              </Button>
            )}
          </Col>
        </Row>
      </Container>
    </Layout>
  );
};

// Composant wrapper qui fournit le contexte
const Dashboard = () => {
  return (
    <NavigationProvider>
      <DashboardContent />
    </NavigationProvider>
  );
};

export default Dashboard;