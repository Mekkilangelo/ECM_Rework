/**
 * PRESENTATION: Composant principal de configuration du rapport
 * Version optimisée avec Clean Architecture
 */

import React, { useMemo } from 'react';
import { Card, Row, Col, Button, Badge, ListGroup, Tooltip, OverlayTrigger, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEye, 
  faFileDownload, 
  faIdCard, 
  faList, 
  faCubes, 
  faChartLine, 
  faMicroscope, 
  faClipboardCheck, 
  faToggleOn, 
  faToggleOff, 
  faImages,
  faInfoCircle 
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useReport } from '../hooks/useReport';
import ReportPreviewModal from './ReportPreviewModal';
import SectionPhotoManager from './SectionPhotoManager';
import './ReportConfiguration.css';

/**
 * Mapping des icônes par type de section
 */
const SECTION_ICONS = {
  identification: faIdCard,
  recipe: faList,
  load: faCubes,
  curves: faChartLine,
  micrography: faMicroscope,
  control: faClipboardCheck
};

/**
 * Composant de configuration du rapport
 */
const ReportConfiguration = React.memo(({ trialId, partId }) => {
  const { t } = useTranslation();

  // Hook personnalisé encapsulant toute la logique
  const {
    sections,
    selectedPhotos,
    loading,
    error,
    progress,
    statistics,
    toggleSection,
    enableAllSections,
    disableAllSections,
    setSectionPhotos,
    generatePreview,
    exportPDF,
    estimateSize
  } = useReport(trialId, partId);

  // État local pour la modal de prévisualisation
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewData, setPreviewData] = React.useState(null);

  /**
   * Gère l'ouverture de l'aperçu
   */
  const handlePreview = async () => {
    const result = await generatePreview();
    if (result) {
      setPreviewData(result);
      setShowPreview(true);
    }
  };

  /**
   * Gère l'export PDF
   */
  const handleExport = async (quality = 'high') => {
    await exportPDF({ quality });
  };

  /**
   * Estimation de taille
   */
  const sizeEstimate = useMemo(() => {
    return estimateSize();
  }, [estimateSize]);

  /**
   * Sections avec photos
   */
  const photoSections = useMemo(() => 
    sections.filter(s => s.hasPhotos),
    [sections]
  );

  return (
    <Card className="mt-3 shadow-sm report-configuration">
      {/* En-tête */}
      <Card.Header as="h5" className="bg-danger text-light d-flex justify-content-between align-items-center">
        <span className="fw-bold">
          {t('report.title', 'Rapport d\'essai')}
        </span>
        <div className="d-flex gap-2">
          <Button
            variant="warning"
            size="sm"
            onClick={handlePreview}
            disabled={loading}
            className="d-flex align-items-center"
          >
            {loading ? (
              <Spinner animation="border" size="sm" className="me-1" />
            ) : (
              <FontAwesomeIcon icon={faEye} className="me-1" />
            )}
            {loading ? t('common.loading', 'Chargement...') : t('report.actions.preview', 'Prévisualiser')}
          </Button>
          
          <Button
            variant="outline-warning"
            size="sm"
            onClick={() => handleExport('high')}
            disabled={loading}
            className="d-flex align-items-center"
          >
            <FontAwesomeIcon icon={faFileDownload} className="me-1" />
            {t('report.actions.downloadPdf', 'PDF')}
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        {/* Barre de progression */}
        {progress && (
          <Alert variant="info" className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>{progress.message}</span>
              <span>{progress.progress}%</span>
            </div>
            <ProgressBar 
              now={progress.progress} 
              variant="danger"
              animated
            />
          </Alert>
        )}

        {/* Erreurs */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => {}}>
            {error}
          </Alert>
        )}

        {/* Statistiques */}
        {statistics && (
          <Card className="mb-3 border-info">
            <Card.Body className="py-2">
              <Row className="text-center">
                <Col>
                  <small className="text-muted">Sections</small>
                  <div className="fw-bold">{statistics.sectionsCount}</div>
                </Col>
                <Col>
                  <small className="text-muted">Photos</small>
                  <div className="fw-bold">{statistics.photosCount}</div>
                </Col>
                <Col>
                  <small className="text-muted">Pages estimées</small>
                  <div className="fw-bold">{statistics.estimatedPages}</div>
                </Col>
                {sizeEstimate && (
                  <Col>
                    <small className="text-muted">Taille estimée</small>
                    <div className="fw-bold">{sizeEstimate.sizeMb} MB</div>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>
        )}

        <Row className="mb-4">
          <Col lg={12}>
            {/* Sélection des sections */}
            <Card className="border-0 shadow-sm mb-3">
              <Card.Header className="bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold">
                    {t('report.sections.title', 'Sections du rapport')}
                  </h6>
                  <div>
                    <Button 
                      size="sm" 
                      variant="outline-danger" 
                      className="me-2"
                      onClick={enableAllSections}
                      type="button"
                    >
                      {t('common.selectAll', 'Tout sélectionner')}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline-secondary"
                      onClick={disableAllSections}
                      type="button"
                    >
                      {t('common.deselectAll', 'Tout désélectionner')}
                    </Button>
                  </div>
                </div>
              </Card.Header>

              <ListGroup variant="flush">
                {sections.map((section) => (
                  <SectionItem
                    key={section.id}
                    section={section}
                    onToggle={() => toggleSection(section.type)}
                    selectedPhotosCount={selectedPhotos[section.type]?.length || 0}
                    icon={SECTION_ICONS[section.type]}
                  />
                ))}
              </ListGroup>
            </Card>

            {/* Gestionnaire de photos */}
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light">
                <h6 className="mb-0 fw-bold">
                  <FontAwesomeIcon icon={faImages} className="me-2" />
                  {t('report.photos.title', 'Photos à inclure dans le rapport')}
                </h6>
              </Card.Header>
              <Card.Body>
                {photoSections.map(section => (
                  <div key={section.id} className="mb-3">
                    <SectionPhotoManager
                      trialNodeId={trialId}
                      partNodeId={partId}
                      sectionType={section.type}
                      onChange={(photos) => setSectionPhotos(section.type, photos)}
                      initialSelectedPhotos={selectedPhotos[section.type] || []}
                      show={section.isEnabled}
                    />
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modal de prévisualisation */}
        {showPreview && previewData && (
          <ReportPreviewModal
            show={showPreview}
            handleClose={() => setShowPreview(false)}
            previewData={previewData}
          />
        )}
      </Card.Body>
    </Card>
  );
});

/**
 * Item de section individuel
 */
const SectionItem = React.memo(({ section, onToggle, selectedPhotosCount, icon }) => {
  const { t } = useTranslation();

  return (
    <OverlayTrigger
      placement="right"
      overlay={<Tooltip id={`tooltip-${section.id}`}>{section.description}</Tooltip>}
    >
      <ListGroup.Item 
        className="d-flex justify-content-between align-items-center border-start-0 border-end-0 section-item"
        action
        onClick={onToggle}
      >
        <div className="d-flex align-items-center flex-grow-1">
          <FontAwesomeIcon 
            icon={icon} 
            className={`me-3 ${section.isEnabled ? 'text-danger' : 'text-muted'}`}
            fixedWidth
          />
          <span className={section.isEnabled ? 'fw-bold' : 'text-muted'}>
            {section.label}
          </span>
          
          {section.hasPhotos && selectedPhotosCount > 0 && (
            <Badge 
              bg="warning" 
              text="dark"
              className="ms-3 fs-6 px-2 py-1"
              pill
            >
              <FontAwesomeIcon icon={faImages} className="me-1" />
              {selectedPhotosCount}
            </Badge>
          )}
        </div>
        
        <div className="toggle-button" onClick={(e) => e.stopPropagation()}>
          <FontAwesomeIcon 
            icon={section.isEnabled ? faToggleOn : faToggleOff} 
            size="2x"
            className={section.isEnabled ? 'text-danger' : 'text-secondary'}
            style={{ cursor: 'pointer' }}
            onClick={onToggle}
          />
        </div>
      </ListGroup.Item>
    </OverlayTrigger>
  );
});

SectionItem.displayName = 'SectionItem';
ReportConfiguration.displayName = 'ReportConfiguration';

export default ReportConfiguration;
