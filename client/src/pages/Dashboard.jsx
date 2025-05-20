import React, { useRef, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { NavigationProvider, useNavigation } from '../context/NavigationContext';
import HierarchyManager from '../components/dashboard/HierarchyManager';
import { useTranslation } from 'react-i18next';
import LimitSelector from '../components/common/LimitSelector';
import Pagination from '../components/common/Pagination';

// Composant qui utilise le hook useHierarchy séparément pour éviter les dépendances circulaires
const DashboardContent = () => {
  // Import dynamique pour éviter la dépendance circulaire
  const { useHierarchy } = require('../hooks/useHierarchy');
  
  const { t } = useTranslation();
  const { currentLevel, hierarchyState, currentPage, itemsPerPage, setItemsPerPage, setCurrentPage, navigateBack } = useNavigation();
  const { totalItems, refreshData } = useHierarchy();
  // Référence vers le LimitSelector pour pouvoir mettre à jour son total
  const limitSelectorRef = useRef(null);
  
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
  
  // Créer une fonction wrapper qui met à jour également le LimitSelector
  const handleDataRefresh = async () => {
    await refreshData();
    // Mettre à jour manuellement le total dans le LimitSelector après avoir rafraîchi les données
    if (limitSelectorRef.current) {
      limitSelectorRef.current.updateTotal(totalItems);
    }
  };
  
  // Mettre à jour le total du LimitSelector quand totalItems change
  useEffect(() => {
    if (limitSelectorRef.current) {
      limitSelectorRef.current.updateTotal(totalItems);
    }
  }, [totalItems]);
  
  return (
    <Layout>
      <Container fluid>
        <Row>
          <Col>
            {/* Contrôles de pagination */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <LimitSelector 
                ref={limitSelectorRef}
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

            {/* Gestionnaire de hiérarchie avec la nouvelle fonction de rafraîchissement */}
            <HierarchyManager onDataChanged={handleDataRefresh} />

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