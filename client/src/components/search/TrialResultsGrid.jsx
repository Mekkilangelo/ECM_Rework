import { Card, Row, Col, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, faMapMarkerAlt, faUser, faCogs, 
  faIndustry, faFire, faFlask, faBoxes, faArrowRight,
  faCheckCircle, faTimesCircle, faHourglass
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Pagination from '../common/Pagination/Pagination';
import './TrialResultsGrid.css';

const TrialResultsGrid = ({ results, pagination, onPageChange }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Icône de statut
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'ok':
      case 'completed':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-success" />;
      case 'nok':
      case 'failed':
        return <FontAwesomeIcon icon={faTimesCircle} className="text-danger" />;
      case 'pending':
      case 'in progress':
        return <FontAwesomeIcon icon={faHourglass} className="text-warning" />;
      default:
        return <FontAwesomeIcon icon={faHourglass} className="text-secondary" />;
    }
  };

  // Couleur de badge de statut
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'ok':
      case 'completed':
        return 'success';
      case 'nok':
      case 'failed':
        return 'danger';
      case 'pending':
      case 'in progress':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Navigation vers la page de détails
  // Sauvegarde l'état de navigation dans sessionStorage pour que le Dashboard le récupère
  const handleViewDetails = (trial) => {
    // Construire l'état de navigation hiérarchique complet
    // Le currentLevel doit être 'trial' car c'est à ce niveau qu'on affiche les trials d'une part
    const navigationState = {
      currentLevel: 'trial',
      hierarchyState: {
        clientId: trial.client?.id || null,
        clientName: trial.client?.name || null,
        orderId: trial.order?.id || null,
        orderName: trial.order?.name || null,
        partId: trial.part?.id || null,
        partName: trial.part?.name || null,
        testId: null,
        testName: null,
      },
      currentPage: 1,
      itemsPerPage: 10
    };
    
    // Sauvegarder l'état de navigation dans sessionStorage
    sessionStorage.setItem('navigationState', JSON.stringify(navigationState));
    
    // Sauvegarder aussi l'ID du trial à ouvrir
    sessionStorage.setItem('openTrialId', trial.id);
    
    // Naviguer vers le Dashboard
    navigate('/dashboard');
  };

  return (
    <div className="trial-results-grid">
      <Row className="g-4">
        {results.map((trial) => (
          <Col key={trial.id} xs={12} lg={6} xl={4}>
            <Card className="trial-card h-100 shadow-sm hover-shadow">
              <Card.Header className="bg-white border-bottom">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <h6 className="mb-1 fw-bold text-truncate">{trial.name || 'Sans nom'}</h6>
                    <small className="text-muted">
                      {trial.trial?.trial_code || 'Pas de code'}
                    </small>
                  </div>
                  <Badge bg={getStatusVariant(trial.trial?.status)} className="ms-2">
                    {getStatusIcon(trial.trial?.status)}
                    <span className="ms-1">{trial.trial?.status || 'N/A'}</span>
                  </Badge>
                </div>
              </Card.Header>

              <Card.Body>
                {/* Date et Localisation */}
                <div className="mb-3">
                  <div className="info-row mb-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-muted me-2" />
                    <small className="text-muted">{t('trialResults.date', 'Date')}:</small>
                    <strong className="ms-2">{formatDate(trial.trial?.trial_date)}</strong>
                  </div>
                  <div className="info-row">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-muted me-2" />
                    <small className="text-muted">{t('trialResults.location', 'Lieu')}:</small>
                    <strong className="ms-2">{trial.trial?.location || 'N/A'}</strong>
                  </div>
                </div>

                {/* Client */}
                {trial.client && (
                  <div className="mb-3 pb-3 border-bottom">
                    <div className="d-flex align-items-center mb-1">
                      <FontAwesomeIcon icon={faUser} className="text-primary me-2" />
                      <small className="text-muted">{t('trialResults.client', 'Client')}:</small>
                    </div>
                    <div className="ms-4">
                      <div className="fw-bold">{trial.client.name}</div>
                      {trial.client.client_code && (
                        <small className="text-muted">{trial.client.client_code}</small>
                      )}
                      {trial.client.city && trial.client.country && (
                        <small className="text-muted d-block">
                          {trial.client.city}, {trial.client.country}
                        </small>
                      )}
                    </div>
                  </div>
                )}

                {/* Pièce */}
                {trial.part && (
                  <div className="mb-3 pb-3 border-bottom">
                    <div className="d-flex align-items-center mb-1">
                      <FontAwesomeIcon icon={faCogs} className="text-success me-2" />
                      <small className="text-muted">
                        {t('trialResults.part', 'Pièce')}:
                      </small>
                    </div>
                    <div className="ms-4">
                      <small className="fw-bold">{trial.part.name}</small>
                      {trial.part.designation && (
                        <Badge bg="light" text="dark" className="ms-2" size="sm">
                          {trial.part.designation}
                        </Badge>
                      )}
                      {trial.part.steel && (
                        <div className="text-muted small">
                          <FontAwesomeIcon icon={faIndustry} className="me-1" />
                          {trial.part.steel.grade || trial.part.steel.family}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Four et Recette */}
                <div className="info-grid">
                  {trial.trial?.furnace && (
                    <div className="info-row mb-2">
                      <FontAwesomeIcon icon={faFire} className="text-warning me-2" />
                      <small className="text-muted">{t('trialResults.furnace', 'Four')}:</small>
                      <small className="ms-2 fw-bold">
                        {trial.trial.furnace.furnace_type || 'N/A'}
                      </small>
                    </div>
                  )}

                  {trial.trial?.recipe && (
                    <div className="info-row mb-2">
                      <FontAwesomeIcon icon={faFlask} className="text-danger me-2" />
                      <small className="text-muted">{t('trialResults.recipe', 'Recette')}:</small>
                      <small className="ms-2 fw-bold">
                        {trial.trial.recipe.recipe_number || 'N/A'}
                      </small>
                    </div>
                  )}

                  {trial.trial?.load_number && (
                    <div className="info-row">
                      <FontAwesomeIcon icon={faBoxes} className="text-info me-2" />
                      <small className="text-muted">{t('trialResults.loadNumber', 'Charge')}:</small>
                      <small className="ms-2 fw-bold">{trial.trial.load_number}</small>
                    </div>
                  )}
                </div>

                {/* Description */}
                {trial.description && (
                  <div className="mt-3 pt-3 border-top">
                    <small className="text-muted d-block text-truncate" title={trial.description}>
                      {trial.description}
                    </small>
                  </div>
                )}
              </Card.Body>

              <Card.Footer className="bg-white border-top">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    {t('trialResults.modified', 'Modifié')}: {formatDate(trial.modified_at)}
                  </small>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleViewDetails(trial)}
                  >
                    {t('trialResults.viewDetails', 'Voir')}
                    <FontAwesomeIcon icon={faArrowRight} className="ms-2" />
                  </Button>
                </div>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Pagination avec le composant réutilisable */}
      <div className="d-flex justify-content-center mt-4">
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
          size="md"
          variant="danger"
        />
      </div>
    </div>
  );
};

export default TrialResultsGrid;
