import React, { useState, useRef, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, ListGroup, Tooltip, OverlayTrigger, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faFileDownload, faIdCard, faList, faCubes, faChartLine, faMicroscope, faClipboardCheck, faToggleOn, faToggleOff, faImages } from '@fortawesome/free-solid-svg-icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import testService from '../../../../../services/testService';
import ReportPreviewModal from './ReportPreviewModal';
import SectionPhotoManager from './SectionPhotoManager';
import './ReportStyles.css';

// Importer les sections de rapport
import ReportHeader from './sections/ReportPageHeader';
import CoverPageSection from './sections/CoverPageSection';
import IdentificationSection from './sections/IdentificationSection';
import RecipeSection from './sections/RecipeSection';
import LoadSection from './sections/LoadSection';
import CurvesSection from './sections/CurvesSection';
import MicrographySection from './sections/MicrographySection';
import ControlSection from './sections/ControlSection';
import ReportFooter from './sections/ReportFooter';

const ReportTabContent = ({ testId, testData, partData, partId }) => {
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
      label: 'Identification', 
      icon: faIdCard, 
      description: 'Informations d\'identification du test et de la pièce',
      hasPhotos: true
    },
    recipe: { 
      label: 'Recette', 
      icon: faList, 
      description: 'Paramètres de la recette utilisée',
      hasPhotos: false
    },
    load: { 
      label: 'Charge', 
      icon: faCubes, 
      description: 'Information sur la charge et le positionnement',
      hasPhotos: true
    },
    curves: { 
      label: 'Courbes', 
      icon: faChartLine, 
      description: 'Graphiques et courbes de température/puissance',
      hasPhotos: true
    },
    micrography: { 
      label: 'Micrographie', 
      icon: faMicroscope, 
      description: 'Images et analyses micrographiques',
      hasPhotos: true
    },
    control: { 
      label: 'Contrôle', 
      icon: faClipboardCheck, 
      description: 'Résultats de mesures et contrôles',
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
        identification: true
      };
      
      const response = await testService.getTestReportData(testId, sectionsToFetch);

      // Ajouter explicitement les photos sélectionnées à reportData
      response.data.selectedPhotos = selectedPhotos;
      
      // Ajouter l'ID de la pièce aux données du rapport
      response.data.partId = parentNodeId;
      
      // Afficher les données dans la console pour débogage
      console.log("ReportTabContent - Photos sélectionnées par section:", selectedPhotos);
      console.log("ReportTabContent - ID de la pièce:", parentNodeId);
      
      setReportData(response.data);
      setShowPreview(true);
    } catch (err) {
      console.error("Erreur lors de la récupération des données du rapport:", err);
      setError("Impossible de charger les données du rapport");
    } finally {
      setLoading(false);
    }
  };
  
  // Générer le PDF
  const generatePDF = () => {
    if (!reportRef.current) return;
    
    html2canvas(reportRef.current, { 
      scale: 2,
      useCORS: true,
      logging: false 
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`rapport-test-${testData?.testCode || reportData?.test?.testCode || 'nouveau'}.pdf`);
    });
  };

  // Déterminer quelles sections ont des photos disponibles
  const photoSections = Object.entries(sectionConfig)
    .filter(([_, config]) => config.hasPhotos)
    .map(([key, _]) => key);
  
  return (
    <Card className="mt-3 shadow-sm">
      <Card.Header as="h5" className="bg-danger text-white d-flex justify-content-between align-items-center">
        <span>Rapport d'essai</span>
        <Badge bg="light" text="dark" className="py-2 px-3">
          Test: {testData?.testCode || testData?.Test?.test_code || reportData?.test?.testCode || 'Nouveau test'}
        </Badge>
      </Card.Header>
      <Card.Body>
        <Row className="mb-4">
          <Col lg={8}>
            <Card className="border-0 shadow-sm mb-3">
              <Card.Header className="bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold">Sections du rapport</h6>
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
                      Tout sélectionner
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
                      Tout désélectionner
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
                        />
                        <span className={selectedSections[key] ? 'fw-bold' : 'text-muted'}>
                          {config.label}
                        </span>
                        {config.hasPhotos && (
                          <Badge 
                            bg="info" 
                            className="ms-2" 
                            pill
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePhotoSection(key);
                            }}
                          >
                            <FontAwesomeIcon icon={faImages} className="me-1" />
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
            
            {/* Gestionnaire de photos par section */}
            <Card className="border-0 shadow-sm mt-4">
              <Card.Header className="bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0 fw-bold">
                    <FontAwesomeIcon icon={faImages} className="me-2" />
                    Photos à inclure dans le rapport
                  </h6>
                </div>
              </Card.Header>
              <Card.Body>
                <Tabs
                  activeKey={activePhotoSection}
                  onSelect={(key) => setActivePhotoSection(key)}
                  className="mb-3"
                >
                  {photoSections.map(section => (
                    <Tab 
                      key={section} 
                      eventKey={section} 
                      title={
                        <span>
                          {sectionConfig[section].label}
                          <Badge 
                            bg="primary" 
                            className="ms-2" 
                            pill
                          >
                            {selectedPhotos[section]?.length || 0}
                          </Badge>
                        </span>
                      }
                    >
                      <SectionPhotoManager
                        testNodeId={testId}
                        partNodeId={parentNodeId}
                        sectionType={section}
                        onChange={handlePhotoSelectionChange}
                        initialSelectedPhotos={selectedPhotos}
                        show={activePhotoSection === section}
                      />
                    </Tab>
                  ))}
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4} className="mt-3 mt-lg-0">
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="d-flex flex-column justify-content-between">
                <div>
                  <h6 className="fw-bold mb-3">Actions</h6>
                  <p className="text-muted mb-4">
                    Prévisualisez ou téléchargez votre rapport personnalisé au format PDF.
                  </p>
                  {error && <p className="text-danger">{error}</p>}
                </div>
                
                <div className="d-grid gap-2">
                  <Button
                    variant="outline-danger"
                    size="lg"
                    onClick={handlePreview}
                    disabled={loading}
                    className="mb-2 d-flex align-items-center justify-content-center"
                  >
                    {loading ? 'Chargement...' : (
                      <>
                        <FontAwesomeIcon icon={faEye} className="me-2" />
                        Prévisualiser le rapport
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={generatePDF}
                    disabled={!reportData || loading}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <FontAwesomeIcon icon={faFileDownload} className="me-2" />
                    Télécharger en PDF
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        {/* Modal d'aperçu du rapport */}
        <ReportPreviewModal
          show={showPreview}
          handleClose={() => setShowPreview(false)}
          generatePDF={generatePDF}
          reportRef={reportRef}
          selectedSections={selectedSections}
          reportData={{
            ...reportData,
            partId: parentNodeId // S'assurer que l'ID est transmis
          }}
          selectedPhotos={selectedPhotos}
          partId={parentNodeId} // Ajouter explicitement partId
          sections={{
            ReportHeader,
            IdentificationSection,
            RecipeSection,
            LoadSection,
            CurvesSection,
            MicrographySection,
            ControlSection,
            ReportFooter
          }}
        />
      </Card.Body>
    </Card>
  );
};

export default ReportTabContent;
