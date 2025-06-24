import React, { useMemo } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import ReportPageHeader from './sections/ReportPageHeader';
import CoverPageSection from './sections/CoverPageSection';

const ReportPreviewModal = ({ 
  show, 
  handleClose, 
  generatePDF, 
  reportRef, 
  selectedSections,
  reportData,
  selectedPhotos = [],
  sections
}) => {
  const {
    ReportHeader,
    IdentificationSection,
    RecipeSection,
    LoadSection,
    CurvesSection,
    MicrographySection,
    ControlSection,
    ReportFooter
  } = sections;  // Récupérer l'ID de la pièce depuis reportData
  const partId = reportData?.partId;

  // Préparation des photos pour les sections (mise en cache avec useMemo)
  const formattedPhotos = useMemo(() => {
    const photos = {};
    if (selectedPhotos) {
      // Transformation de la structure des photos
      Object.keys(selectedPhotos).forEach(sectionKey => {
        if (selectedPhotos[sectionKey]) {
          // Pour les sections qui utilisent des sous-catégories
          if (typeof selectedPhotos[sectionKey] === 'object' && !Array.isArray(selectedPhotos[sectionKey])) {
            photos[sectionKey] = [];
            Object.keys(selectedPhotos[sectionKey]).forEach(subcategory => {
              if (Array.isArray(selectedPhotos[sectionKey][subcategory])) {
                photos[sectionKey] = [
                  ...photos[sectionKey],
                  ...selectedPhotos[sectionKey][subcategory]
                ];
              }
            });
          } else if (Array.isArray(selectedPhotos[sectionKey])) {
            photos[sectionKey] = selectedPhotos[sectionKey];
          }
        }
      });
    }
    return photos;
  }, [selectedPhotos]); // Ne recalculer que si selectedPhotos change

  // Reformater les données de test avec toutes les données nécessaires (mise en cache avec useMemo)
  const formattedTestData = useMemo(() => {
    if (!reportData) return null;
    return {
      testCode: reportData.testCode || '',
      processType: reportData.processType || '',
      loadNumber: reportData.loadNumber || '',
      testDate: reportData.testDate || null,
      // Inclure toutes les données nécessaires pour les sections
      quench_data: reportData.quenchData || null,
      recipe_data: reportData.recipeData || null,
      furnace_data: reportData.furnaceData || null,
      results_data: reportData.resultsData || null,
      load_data: reportData.loadData || null,
      // Autres données utiles
      testId: reportData.testId || '',
      testName: reportData.testName || '',
      location: reportData.location || '',
      status: reportData.status || '',
      mountingType: reportData.mountingType || '',
      positionType: reportData.positionType || '',
      preoxMedia: reportData.preoxMedia || ''
    };
  }, [reportData]); // Ne recalculer que si reportData change

  // Extraire les données client pour l'en-tête
  const clientData = reportData?.client || {};

  // Si les données du rapport ne sont pas chargées
  if (!reportData) {
    return (
      <Modal show={show} onHide={handleClose} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Aperçu du rapport</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-5">
          <Spinner animation="border" variant="danger" />
          <p className="mt-3">Chargement des données du rapport...</p>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Aperçu du rapport</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="report-container" ref={reportRef}>
          {/* Page de garde (toujours affichée en première page) */}
          <div className="report-page" style={{ 
            padding: '20px', 
            minHeight: '297mm', 
            position: 'relative',
            pageBreakAfter: 'always'          }}>
            <CoverPageSection 
              testData={formattedTestData} 
              partData={reportData.part} 
              clientData={clientData}
            />
          </div>
          
          {/* Première page avec identification ou première section sélectionnée */}
          {selectedSections.identification ? (
            <div className="report-page" style={{ 
              padding: '20px', 
              minHeight: '297mm', 
              position: 'relative',
              pageBreakAfter: 'always' 
            }}>
              {/* En-tête principal */}
              <ReportHeader testData={formattedTestData} clientData={clientData} />
              
              {/* Section Identification */}              <div style={{ marginTop: '30px' }}>
                <IdentificationSection 
                  testData={formattedTestData} 
                  partData={reportData.part} 
                  clientData={clientData} 
                  selectedPhotos={selectedPhotos} 
                  partId={partId}  // Ajout de l'ID de la pièce
                />
              </div>
            </div>
          ) : (
            /* Si identification n'est pas sélectionnée, commencer par la première section active */
            null /* Ne pas créer de page vide */
          )}          {/* Section Recipe sur une nouvelle page */}
          {selectedSections.recipe && (reportData.recipe_data || reportData.recipeData) && (
            <div className="report-page" style={{ 
              padding: '20px', 
              minHeight: '297mm', 
              position: 'relative',
              pageBreakAfter: 'always' 
            }}>
              <ReportPageHeader testData={formattedTestData} clientData={clientData} />
              <RecipeSection 
                testData={formattedTestData} 
                recipeData={reportData.recipe_data || reportData.recipeData}
              />
            </div>
          )}
          
          {/* Section Load sur une nouvelle page */}
          {selectedSections.load && (
            <div className="report-page" style={{ 
              padding: '20px', 
              minHeight: '297mm', 
              position: 'relative',
              pageBreakAfter: 'always'            }}>
              <ReportPageHeader testData={formattedTestData} clientData={clientData} />
              <LoadSection 
                testData={formattedTestData} 
                selectedPhotos={formattedPhotos || selectedPhotos}  // Utiliser les photos formatées
                partId={partId}  // Ajout de l'ID de la pièce
              />
            </div>
          )}
          
          {/* Section Curves sur une nouvelle page */}
          {selectedSections.curves && (
            <div className="report-page" style={{ 
              padding: '20px', 
              minHeight: '297mm', 
              position: 'relative',
              pageBreakAfter: 'always' 
            }}>
              <ReportPageHeader testData={formattedTestData} clientData={clientData} />              <CurvesSection 
                testData={formattedTestData} 
                selectedPhotos={formattedPhotos || selectedPhotos}  // Ajouter ici
                partId={partId}  // Ajout de l'ID de la pièce
              />
            </div>
          )}
          
          {/* Section Micrography sur une nouvelle page */}
          {selectedSections.micrography && (
            <div className="report-page" style={{ 
              padding: '20px', 
              minHeight: '297mm', 
              position: 'relative',
              pageBreakAfter: 'always'            }}>
              <ReportPageHeader testData={formattedTestData} clientData={clientData} />
              <MicrographySection 
                testData={formattedTestData} 
                selectedPhotos={formattedPhotos || selectedPhotos}  // Ajouter ici
                partId={partId}  // Ajout de l'ID de la pièce
              />
            </div>
          )}
            {/* Section Control avec une page par résultat */}
          {selectedSections.control && reportData.results && (
            <>
              {reportData.results.map((result, index) => {
                // Débogage des spécifications
                console.log(`Result ${index} - Part Data:`, reportData.part);
                console.log(`Result ${index} - Specifications:`, reportData.part?.specifications);
                
                return (
                  <div key={`result-${index}`} className="report-page" style={{ 
                    padding: '20px', 
                    minHeight: '297mm', 
                    position: 'relative',
                    pageBreakAfter: 'always' 
                  }}>
                    <ReportPageHeader testData={formattedTestData} clientData={clientData} />
                    <h3 style={{ 
                      borderBottom: '2px solid #20c997', 
                      paddingBottom: '5px', 
                      marginBottom: '15px',
                      color: '#20c997' 
                    }}>
                      Contrôles et résultats
                    </h3>                    <ControlSection 
                      testData={{
                        ...formattedTestData,
                        results: [result] // N'envoyer que le résultat actuel
                      }} 
                      partData={reportData.part || {}}
                    />
                  </div>
                );
              })}
            </>
          )}
          
        {/* Pied de page seulement s'il y a au moins une section sélectionnée */}
          {(selectedSections.identification || 
            selectedSections.recipe || selectedSections.load || 
            selectedSections.curves || selectedSections.micrography || 
            selectedSections.control) && (
            <div className="report-page" style={{ 
              padding: '20px', 
              position: 'relative'
            }}>
              <ReportPageHeader testData={formattedTestData} clientData={clientData} />
              <ReportFooter />
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Fermer
        </Button>
        <Button variant="success" onClick={generatePDF}>
          Télécharger PDF
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default React.memo(ReportPreviewModal);
