import React from 'react';
import Layout from '../components/layout/Layout';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { NavigationProvider, useNavigation } from '../context/NavigationContext';
import HierarchyManager from '../components/dashboard/HierarchyManager';
import { useHierarchy } from '../hooks/useHierarchy';

// Composant Dashboard qui utilise les hooks
const DashboardContent = () => {
  const { currentLevel, hierarchyState, currentPage, itemsPerPage, setItemsPerPage, setCurrentPage, navigateBack } = useNavigation();
  const { totalItems } = useHierarchy();
  
  // Calculer le nombre de pages
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Générer le fil d'Ariane dynamique
  const generateBreadcrumb = () => {
    const breadcrumb = ['Clients'];
    
    if (hierarchyState.clientId) {
      breadcrumb.push(hierarchyState.clientName || 'Client');
      
      if (hierarchyState.orderId) {
        breadcrumb.push(hierarchyState.orderName || 'Commande');
        
        if (hierarchyState.partId) {
          breadcrumb.push(hierarchyState.partName || 'Pièce');
          
          if (hierarchyState.testId) {
            breadcrumb.push(hierarchyState.testName || 'Test');
          }
        }
      }
    }
    
    return breadcrumb;
  };
  
  // Déterminer si on affiche le bouton de retour
  const showBackButton = currentLevel !== 'client';
  
  // Gérer le changement de limite d'éléments par page
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
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
            {/* Navigation en fil d'Ariane */}
            <nav aria-label="breadcrumb">
              <ol id="breadcrumb-nav" className="breadcrumb">
                {generateBreadcrumb().map((item, index) => (
                  <li 
                    key={index} 
                    className={`breadcrumb-item ${index === generateBreadcrumb().length - 1 ? 'active' : ''}`}
                    aria-current={index === generateBreadcrumb().length - 1 ? 'page' : null}
                  >
                    {item}
                  </li>
                ))}
              </ol>
            </nav>

            {/* Contrôles de pagination */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <p style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                  Afficher par:
                </p>
                <select 
                  id="limit-value" 
                  className="form-select" 
                  style={{ width: 'auto', display: 'inline-block' }}
                  value={itemsPerPage}
                  onChange={handleLimitChange}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              
              <div>
                {totalPages > 1 && (
                  <div className="d-flex align-items-center">
                    <button 
                      className="btn btn-sm btn-outline-secondary mr-2" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Précédent
                    </button>
                    <span className="mx-2">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button 
                      className="btn btn-sm btn-outline-secondary ml-2" 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Suivant
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Gestionnaire de hiérarchie */}
            <HierarchyManager />

            {/* Bouton de retour */}
            {showBackButton && (
              <Button 
                id="back-button" 
                className="btn btn-secondary me-6 mb-3 mt-3"
                onClick={handleBackClick}
              >
                Retour
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