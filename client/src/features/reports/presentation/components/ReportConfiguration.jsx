import React, { useState, useMemo, useCallback } from 'react';
import { Card, Nav, Tab, Button, Badge, Form, ListGroup, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye,
  faFileDownload,
  faCheckSquare,
  faSquare,
  faImages,
  faLayerGroup,
  faToggleOn,
  faToggleOff,
  faFilePdf,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useReport } from '../hooks/useReport';
// Removed ReportPreviewModal import
import SectionPhotoManager from './SectionPhotoManager';
import './ReportConfiguration.css';

const ReportConfiguration = React.memo(({ trialId, partId }) => {
  const { t } = useTranslation();

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
    setSectionOption,
    generatePreview,
    exportPDF,
    estimateSize
  } = useReport(trialId, partId);

  const [activeTab, setActiveTab] = useState('sections');
  // Removed showPreview and previewData state
  const [filterSection, setFilterSection] = useState('all');

  // Helper pour obtenir le label traduit d'une section
  const getSectionLabel = useCallback((sectionType) => {
    return t(`report.sections.${sectionType}.label`, sectionType);
  }, [t]);

  const handlePreview = useCallback(async () => {
    const result = await generatePreview();
    if (result && result.url) {
      // Open in new window directly
      window.open(result.url, '_blank');
    }
  }, [generatePreview]);

  const handleExport = useCallback(async (quality = 'high') => {
    await exportPDF({ quality });
  }, [exportPDF]);

  const sizeEstimate = useMemo(() => estimateSize(), [estimateSize]);

  const photoSections = useMemo(() => sections.filter(s => s.hasPhotos), [sections]);

  const enabledSections = useMemo(() => sections.filter(s => s.isEnabled), [sections]);

  // Helper pour extraire les photos d'une section (gère tableau ou objet hiérarchique)
  const getPhotosFromSection = useCallback((sectionType) => {
    const sectionPhotos = selectedPhotos[sectionType];
    if (!sectionPhotos) return [];
    if (Array.isArray(sectionPhotos)) return sectionPhotos;
    // Si c'est un objet, extraire toutes les photos des sous-catégories
    if (typeof sectionPhotos === 'object') {
      return Object.values(sectionPhotos).flat().filter(Boolean);
    }
    return [];
  }, [selectedPhotos]);

  // Compte le nombre de photos pour une section
  const getPhotoCount = useCallback((sectionType) => {
    return getPhotosFromSection(sectionType).length;
  }, [getPhotosFromSection]);

  const allPhotos = useMemo(() => {
    return photoSections.flatMap(section =>
      getPhotosFromSection(section.type).map(photo => ({
        ...photo,
        sectionType: section.type,
        sectionLabel: getSectionLabel(section.type)
      }))
    );
  }, [photoSections, getPhotosFromSection, getSectionLabel]);

  const filteredPhotos = useMemo(() => {
    if (filterSection === 'all') return allPhotos;
    return allPhotos.filter(p => p.sectionType === filterSection);
  }, [allPhotos, filterSection]);

  return (
    <div className="report-configuration-layout">
      <div className="report-content">
        <Card className="report-configuration">
          <Card.Header className="bg-danger text-light">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <h5 className="mb-0 fw-bold">{t('report.title')}</h5>
                {statistics && (
                  <div className="d-flex gap-3 small">
                    <Badge bg="light" text="dark">
                      {t('report.stats.selectedSections', { count: enabledSections.length })}
                    </Badge>
                    <Badge bg="warning" text="dark">
                      {t('report.stats.selectedPhotos', { count: allPhotos.length })}
                    </Badge>
                    {sizeEstimate && (
                      <Badge bg="light" text="dark">
                        {t('report.stats.estimatedSize', { size: sizeEstimate.sizeMb + ' MB' })}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card.Header>

          <Card.Body className="p-0">
            {error && (
              <Alert variant="danger" className="m-3 mb-0">{error}</Alert>
            )}

            <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
              <Nav variant="tabs" className="border-bottom">
                <Nav.Item>
                  <Nav.Link eventKey="sections" className="d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faLayerGroup} />
                    {t('report.tabs.sections')}
                    <Badge bg="secondary" pill>{enabledSections.length}/{sections.length}</Badge>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="photos" className="d-flex align-items-center gap-2">
                    <FontAwesomeIcon icon={faImages} />
                    {t('report.tabs.photos')}
                    <Badge bg="danger" pill>{allPhotos.length}</Badge>
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content className="p-3">
                <Tab.Pane eventKey="sections">
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <Button size="sm" variant="outline-danger" onClick={enableAllSections} className="me-2">
                          <FontAwesomeIcon icon={faCheckSquare} className="me-1" />
                          {t('common.selectAll')}
                        </Button>
                        <Button size="sm" variant="outline-secondary" onClick={disableAllSections}>
                          <FontAwesomeIcon icon={faSquare} className="me-1" />
                          {t('common.deselectAll')}
                        </Button>
                      </div>
                    </div>

                    <ListGroup variant="flush">
                      {sections.sort((a, b) => a.order - b.order).map(section => (
                        <ListGroup.Item key={section.id} className="section-toggle-item">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center flex-grow-1">
                              <span className={section.isEnabled ? 'fw-bold' : 'text-muted'}>
                                {getSectionLabel(section.type)}
                              </span>
                              {section.hasPhotos && getPhotoCount(section.type) > 0 && (
                                <Badge bg="danger" className="ms-2" pill>
                                  <FontAwesomeIcon icon={faImages} className="me-1" />
                                  {getPhotoCount(section.type)}
                                </Badge>
                              )}
                            </div>
                            <FontAwesomeIcon
                              icon={section.isEnabled ? faToggleOn : faToggleOff}
                              size="2x"
                              className={`section-toggle ${section.isEnabled ? 'active' : ''}`}
                              onClick={() => toggleSection(section.type)}
                            />
                          </div>

                          {/* Sous-options pour la section Recipe */}
                          {section.type === 'recipe' && section.isEnabled && (
                            <div className="ms-4 mt-2 pt-2 border-top">
                              <Form.Check
                                type="checkbox"
                                id="showRecipeDetails"
                                label={
                                  <span className="small">
                                    <FontAwesomeIcon icon={faLayerGroup} className="me-2 text-muted" />
                                    {t('report.sections.recipe.options.showDetails', 'Show recipe details')}
                                  </span>
                                }
                                checked={section.options?.showRecipeDetails !== false}
                                onChange={(e) => {
                                  setSectionOption('recipe', 'showRecipeDetails', e.target.checked);
                                  // Si les deux options sont décochées, désactiver la section
                                  if (!e.target.checked && section.options?.showRecipeCurve === false) {
                                    toggleSection('recipe');
                                  }
                                }}
                                className="mb-1"
                              />
                              <small className="text-muted d-block ms-4 mb-2">
                                {t('report.sections.recipe.options.showDetailsDescription', 'Display recipe number, preox, thermal/chemical cycles, and quench data')}
                              </small>

                              <Form.Check
                                type="checkbox"
                                id="showRecipeCurve"
                                label={
                                  <span className="small">
                                    <FontAwesomeIcon icon={faChartLine} className="me-2 text-muted" />
                                    {t('report.sections.recipe.options.showCurve', 'Show cycle chart')}
                                  </span>
                                }
                                checked={section.options?.showRecipeCurve !== false}
                                onChange={(e) => {
                                  setSectionOption('recipe', 'showRecipeCurve', e.target.checked);
                                  // Si les deux options sont décochées, désactiver la section
                                  if (!e.target.checked && section.options?.showRecipeDetails === false) {
                                    toggleSection('recipe');
                                  }
                                }}
                                className="mb-0"
                              />
                              <small className="text-muted d-block ms-4">
                                {t('report.sections.recipe.options.showCurveDescription', 'Display thermal and chemical cycle graph')}
                              </small>
                            </div>
                          )}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                </Tab.Pane>

                <Tab.Pane eventKey="photos">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Form.Group className="mb-0">
                      <Form.Label className="small text-muted mb-1">{t('report.photos.filter')}</Form.Label>
                      <Form.Select
                        size="sm"
                        value={filterSection}
                        onChange={(e) => setFilterSection(e.target.value)}
                        style={{ width: '250px' }}
                      >
                        <option value="all">{t('report.photos.allSections')}</option>
                        {photoSections.map(section => (
                          <option key={section.id} value={section.type}>
                            {getSectionLabel(section.type)} ({getPhotoCount(section.type)})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Badge bg="light" text="dark" className="px-3 py-2">
                      {filteredPhotos.length} / {allPhotos.length}
                    </Badge>
                  </div>

                  {photoSections.map(section => (
                    <div
                      key={section.id}
                      style={{ display: filterSection === 'all' || filterSection === section.type ? 'block' : 'none' }}
                    >
                      <SectionPhotoManager
                        trialNodeId={trialId}
                        partNodeId={partId}
                        sectionType={section.type}
                        onChange={(sectionType, photos) => setSectionPhotos(sectionType, photos)}
                        initialSelectedPhotos={selectedPhotos}
                        show={section.isEnabled}
                      />
                    </div>
                  ))}
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </Card.Body>
        </Card>
      </div>

      {/* Panel sticky à droite */}
      <div className="report-actions-panel">
        {loading && (
          <div className="report-loading-indicator mb-3 p-3 bg-white rounded shadow-sm">
            <div className="d-flex align-items-center mb-2">
              <FontAwesomeIcon icon={faFilePdf} className="text-danger mr-2" />
              <small className="text-muted">
                {progress?.message || t('report.generating', 'Génération en cours...')}
              </small>
            </div>
            {progress?.progress !== undefined && (
              <div className="progress" style={{ height: '4px' }}>
                <div
                  className="progress-bar bg-danger"
                  role="progressbar"
                  style={{ width: `${progress.progress}%` }}
                  aria-valuenow={progress.progress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            )}
          </div>
        )}
        <div className="report-action-item" onClick={handlePreview}>
          <div className={`report-action-button ${loading ? 'disabled' : ''}`}>
            <FontAwesomeIcon icon={faEye} className="report-action-icon" />
            <span className="report-action-text">{t('report.actions.preview')}</span>
          </div>
        </div>
        <div className="report-action-item" onClick={() => !loading && handleExport('high')}>
          <div className={`report-action-button ${loading ? 'disabled' : ''}`}>
            <FontAwesomeIcon icon={faFileDownload} className="report-action-icon" />
            <span className="report-action-text">{t('report.actions.downloadPdf')}</span>
          </div>
        </div>
        {sizeEstimate && (
          <div className="report-stats-box">
            <div className="report-stats-label">{t('report.preview.size')}</div>
            <div className="report-stats-value">{sizeEstimate.sizeMb} MB</div>
          </div>
        )}
      </div>
    </div>
  );
});

ReportConfiguration.displayName = 'ReportConfiguration';

export default ReportConfiguration;
