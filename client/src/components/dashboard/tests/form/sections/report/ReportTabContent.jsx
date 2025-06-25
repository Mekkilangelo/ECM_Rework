import React, { useState, useRef, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, ListGroup, Tooltip, OverlayTrigger, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFileDownload, faIdCard, faList, faCubes, faChartLine, faMicroscope, faClipboardCheck, faToggleOn, faToggleOff, faImages } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import testService from '../../../../../../services/testService';
import ReportPreviewModal from './ReportPreviewModal';
import SectionPhotoManager from './SectionPhotoManager';
import './ReportStyles.css';

// Importer les sections de rapport
import CoverPageSection from './sections/CoverPageSection';
import IdentificationSection from './sections/IdentificationSection';
import RecipeSection from './sections/RecipeSection';
import LoadSection from './sections/LoadSection';
import CurvesSection from './sections/CurvesSection';
import MicrographySection from './sections/MicrographySection';
import ControlSection from './sections/ControlSection';

const ReportTabContent = ({ testId, testData, partData, partId }) => {
  const { t } = useTranslation();
  
  // Utilisez partId directement si disponible, sinon essayez de le récupérer de partData
  const [parentNodeId, setParentNodeId] = useState(partId || partData?.id || null);

  // Mettre à jour parentNodeId quand partData change
  useEffect(() => {
    if (partData && partData.id) {
      setParentNodeId(partData.id);
      console.log("ID de pièce défini:", partData.id);
    }
  }, [partData]);
  // Configuration des sections avec métadonnées pour une meilleure UI
  const sectionConfig = {
    identification: { 
      label: t('report.sections.identification.label', 'Identification'), 
      icon: faIdCard, 
      description: t('report.sections.identification.description', 'Informations d\'identification du test et de la pièce'),
      hasPhotos: true
    },
    recipe: { 
      label: t('report.sections.recipe.label', 'Recette'), 
      icon: faList, 
      description: t('report.sections.recipe.description', 'Paramètres de la recette utilisée'),
      hasPhotos: false
    },
    load: { 
      label: t('report.sections.load.label', 'Charge'), 
      icon: faCubes, 
      description: t('report.sections.load.description', 'Information sur la charge et le positionnement'),
      hasPhotos: true
    },
    curves: { 
      label: t('report.sections.curves.label', 'Courbes'), 
      icon: faChartLine, 
      description: t('report.sections.curves.description', 'Graphiques et courbes de température/puissance'),
      hasPhotos: true
    },
    micrography: { 
      label: t('report.sections.micrography.label', 'Micrographie'), 
      icon: faMicroscope, 
      description: t('report.sections.micrography.description', 'Images et analyses micrographiques'),
      hasPhotos: true
    },
    control: { 
      label: t('report.sections.control.label', 'Contrôle'), 
      icon: faClipboardCheck, 
      description: t('report.sections.control.description', 'Résultats de mesures et contrôles'),
      hasPhotos: false
    },
  };
  
  // État pour les sections sélectionnées
  const [selectedSections, setSelectedSections] = useState({
    identification: true,
    recipe: true,
    load: true,
    curves: true,
    micrography: true,
    control: true,
  });
  
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reportRef = useRef(null);
  
    // État pour l'onglet de gestion de photos actif
  const [activePhotoSection, setActivePhotoSection] = useState('identification');
  
  // État pour les photos sélectionnées organisées par section
  const [selectedPhotos, setSelectedPhotos] = useState({
    identification: [],
    micrography: [],
    load: [],
    curves: []
  });

  // État pour stocker les gestionnaires de photos de chaque section
  const [photoManagers, setPhotoManagers] = useState({});
  
  // Charger l'ID du nœud parent (pièce) au montage
  useEffect(() => {
    const loadPartNodeId = async () => {
      if (!testId) return;
      
      try {
        // D'abord, récupérez le test
        const testResponse = await testService.getTestById(testId);
        
        if (testResponse.data) {
          // Si parent_id existe et est disponible directement
          if (testResponse.data.parent_id) {
            // Tester si c'est une pièce
            try {
              const nodeResponse = await testService.getNodeById(testResponse.data.parent_id);
              if (nodeResponse.data && nodeResponse.data.type === 'part') {
                console.log("Found part node:", nodeResponse.data);
                setParentNodeId(nodeResponse.data.id);
              } else {
                console.log("Parent is not a part, searching part in ancestors");
                // TODO: Ajouter une API pour trouver l'ancêtre de type pièce
              }
            } catch (nodeError) {
              console.error("Error fetching node:", nodeError);
            }
          } 
          // Si nous avons l'information de part_id directement
          else if (testResponse.data.part_id) {
            console.log("Using part_id directly:", testResponse.data.part_id);
            setParentNodeId(testResponse.data.part_id);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'ID du nœud parent:", error);
      }
    };
    
    loadPartNodeId();
  }, [testId]);
  
  // Gérer les changements de sélection de sections
  const handleSectionToggle = (sectionName, event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setSelectedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };
  
  // Sélectionner ou désélectionner toutes les sections
  const toggleAllSections = (value) => {
    const newSelectedSections = {};
    
    Object.keys(sectionConfig).forEach(key => {
      newSelectedSections[key] = value;
    });
    
    setSelectedSections(newSelectedSections);
  };
  
  // Gérer les changements de sélection de photos pour une section
  const handlePhotoSelectionChange = (section, selectedIds) => {
    console.log(`PhotoSelectionChange - section: ${section}, selectedIds:`, selectedIds);
    
    // NOUVELLE APPROCHE: Préserver la structure hiérarchique des photos
    setSelectedPhotos(prev => ({
      ...prev,
      [section]: selectedIds  // Garder la structure d'origine, qu'elle soit plate ou hiérarchique
    }));
  };
  
  // Fonction pour prévisualiser le rapport
  const handlePreview = async () => {
    if (!testId) {
      console.error("Impossible de prévisualiser: ID du test manquant");
      setError("ID du test manquant");
      return;
    }

    // Vérifiez également si l'ID de pièce est disponible
    if (!parentNodeId) {
      console.error("Impossible de prévisualiser: ID de la pièce manquant");
      setError("ID de la pièce manquant");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Pour garantir la récupération des spécifications de la pièce et les photos
      const sectionsToFetch = {
        ...selectedSections,
        // Forcer identification pour récupérer les données client
        identification: true      };
        const reportDataResponse = await testService.getTestReportData(testId, sectionsToFetch);      // Créer un nouvel objet de rapport avec toutes les données nécessaires
      const completeReportData = {
        ...reportDataResponse,
        selectedPhotos: selectedPhotos,
        partId: parentNodeId
      };
      
      setReportData(completeReportData);
      setShowPreview(true);
    } catch (err) {
      console.error("Erreur lors de la récupération des données du rapport:", err);
      setError("Impossible de charger les données du rapport");
    } finally {
      setLoading(false);
    }  };

  // Déterminer quelles sections ont des photos disponibles
  const photoSections = Object.entries(sectionConfig)
    .filter(([_, config]) => config.hasPhotos)
    .map(([key, _]) => key);
  return (    <Card className="mt-3 shadow-sm">
      <Card.Header as="h5" className="bg-danger text-light d-flex justify-content-between align-items-center">
        <span className="fw-bold">{t('report.title', 'Rapport d\'essai')}</span>
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
            disabled={true}
            className="d-flex align-items-center"
            title={t('report.actions.pdfFromPreview', 'Utilisez la prévisualisation pour générer le PDF')}
          >
            <FontAwesomeIcon icon={faFileDownload} className="me-1" />
            {t('report.actions.downloadPdf', 'PDF')}
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Row className="mb-4">
          <Col lg={12}>
            <Card className="border-0 shadow-sm mb-3">              <Card.Header className="bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold">{t('report.sections.title', 'Sections du rapport')}</h6>
                  <div>
                    <Button 
                      size="sm" 
                      variant="outline-danger" 
                      className="me-2"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleAllSections(true);
                      }}
                      type="button"
                    >
                      {t('common.selectAll', 'Tout sélectionner')}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline-secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleAllSections(false);
                      }}
                      type="button"
                    >
                      {t('common.deselectAll', 'Tout désélectionner')}
                    </Button>
                  </div>
                </div>
              </Card.Header>
              <ListGroup variant="flush">
                {Object.entries(sectionConfig).map(([key, config]) => (
                  <OverlayTrigger
                    key={key}
                    placement="right"
                    overlay={
                      <Tooltip id={`tooltip-${key}`}>{config.description}</Tooltip>
                    }
                  >
                    <ListGroup.Item 
                      className="d-flex justify-content-between align-items-center border-start-0 border-end-0"
                      action
                      onClick={(e) => handleSectionToggle(key, e)}
                    >
                      <div className="d-flex align-items-center">
                        <FontAwesomeIcon 
                          icon={config.icon} 
                          className={`me-3 ${selectedSections[key] ? 'text-danger' : 'text-muted'}`}
                          fixedWidth
                        />                        <span className={selectedSections[key] ? 'fw-bold mr-1' : 'text-muted mr-1'}>
                          {config.label}
                        </span>
                        {config.hasPhotos && (
                          <Badge 
                            bg="warning" 
                            text="dark"
                            className="ms-auto fs-6 px-2 py-1"
                            pill
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePhotoSection(key);
                            }}                          >
                            <FontAwesomeIcon icon={faImages} className="me-1 mr-1" />
                            {selectedPhotos[key]?.length || 0}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="toggle-button" onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSectionToggle(key, e);
                      }}>
                        <FontAwesomeIcon 
                          icon={selectedSections[key] ? faToggleOn : faToggleOff} 
                          size="2x"
                          className={selectedSections[key] ? 'text-danger' : 'text-secondary'}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                    </ListGroup.Item>
                  </OverlayTrigger>
                ))}
              </ListGroup>
            </Card>
              {/* Gestionnaire de photos par section */}            <Card className="border-0 shadow-sm mt-4">
              <Card.Header className="bg-light">
                <h6 className="mb-0 fw-bold">
                  <FontAwesomeIcon icon={faImages} className="me-2" />
                  {t('report.photos.title', 'Photos à inclure dans le rapport')}
                </h6>
              </Card.Header>
              <Card.Body>
                {error && (
                  <div className="alert alert-danger mb-3">{error}</div>
                )}
                  {/* Affichage de tous les gestionnaires de photos */}
                {photoSections.map(section => (
                  <div key={section} className="mb-3">
                    <SectionPhotoManager
                      key={`${section}-${testId}-${parentNodeId}`}
                      testNodeId={testId}
                      partNodeId={parentNodeId}
                      sectionType={section}
                      onChange={handlePhotoSelectionChange}
                      initialSelectedPhotos={selectedPhotos}
                      show={true}
                    />
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>          {/* Modal d'aperçu du rapport */}
        <ReportPreviewModal
          show={showPreview}
          handleClose={() => setShowPreview(false)}
          reportRef={reportRef}
          selectedSections={selectedSections}
          reportData={reportData} // Données chargées seulement à l'ouverture du modal
          selectedPhotos={selectedPhotos} // Mise à jour dynamique pour la sélection de photos
          sections={{
            IdentificationSection,
            RecipeSection,
            LoadSection,
            CurvesSection,
            MicrographySection,
            ControlSection
          }}
        />
      </Card.Body>
    </Card>
  );
};

export default ReportTabContent;
