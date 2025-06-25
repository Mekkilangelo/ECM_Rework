import React, { useMemo } from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import CoverPageSection from './sections/CoverPageSection';

const ReportPreviewModal = ({ 
  show, 
  handleClose, 
  reportRef, 
  selectedSections,
  reportData,
  selectedPhotos = [],
  sections
}) => {
  const {
    IdentificationSection,
    RecipeSection,
    LoadSection,
    CurvesSection,
    MicrographySection,
    ControlSection
  } = sections;

  // Récupérer l'ID de la pièce depuis reportData
  const partId = reportData?.partId;  // Fonction pour générer le PDF page par page
  const generatePDF = async () => {
    if (!reportRef.current) return;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Marges pour le contenu (en mm)
    const margin = 10;
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = pdfHeight - (margin * 2);
    
    // Récupérer toutes les pages du rapport
    const reportPages = reportRef.current.querySelectorAll('.report-page');
    
    if (reportPages.length === 0) {
      console.error("Aucune page de rapport trouvée");
      return;
    }

    try {
      let isFirstPage = true;
      
      for (let i = 0; i < reportPages.length; i++) {
        const page = reportPages[i];
        
        // Capturer chaque section individuellement
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false,
          width: page.offsetWidth,
          height: page.offsetHeight,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        // Calculer le ratio pour maintenir les proportions tout en s'adaptant à la largeur
        const ratio = contentWidth / (imgWidth / 2); // Diviser par 2 car scale = 2
        const scaledWidth = contentWidth;
        const scaledHeight = (imgHeight / 2) * ratio;
        
        // Si le contenu dépasse la hauteur d'une page, le découper
        if (scaledHeight > contentHeight) {
          // Calculer combien de pages sont nécessaires
          const pagesNeeded = Math.ceil(scaledHeight / contentHeight);
          
          for (let pageIndex = 0; pageIndex < pagesNeeded; pageIndex++) {
            // Ajouter une nouvelle page (sauf pour la première)
            if (!isFirstPage) {
              pdf.addPage();
            }
            isFirstPage = false;
            
            // Calculer la portion de l'image à afficher
            const yOffsetPdf = pageIndex * contentHeight;
            const remainingHeight = scaledHeight - yOffsetPdf;
            const currentPageHeight = Math.min(contentHeight, remainingHeight);
            
            // Calculer les coordonnées dans l'image source
            const sourceY = (yOffsetPdf / ratio) * 2; // Reconvertir en pixels avec scale
            const sourceHeight = (currentPageHeight / ratio) * 2;
            
            // Créer un canvas temporaire pour cette portion
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = imgWidth;
            tempCanvas.height = sourceHeight;
            
            // Charger l'image et extraire la portion
            const img = new Image();
            await new Promise((resolve) => {
              img.onload = () => {
                // Dessiner la portion de l'image
                tempCtx.drawImage(
                  img,
                  0, sourceY, imgWidth, sourceHeight, // Source (x, y, width, height)
                  0, 0, imgWidth, sourceHeight        // Destination
                );
                
                // Convertir en image et ajouter au PDF
                const tempImgData = tempCanvas.toDataURL('image/png');
                pdf.addImage(
                  tempImgData,
                  'PNG',
                  margin,
                  margin,
                  scaledWidth,
                  currentPageHeight
                );
                
                resolve();
              };
              img.src = imgData;
            });
          }
        } else {
          // Le contenu tient sur une seule page
          if (!isFirstPage) {
            pdf.addPage();
          }
          isFirstPage = false;
          
          // Centrer verticalement si le contenu est plus petit que la page
          const yPosition = margin + Math.max(0, (contentHeight - scaledHeight) / 2);
          
          pdf.addImage(
            imgData,
            'PNG',
            margin,
            yPosition,
            scaledWidth,
            scaledHeight
          );
        }
      }
      
      // Sauvegarder le PDF
      const fileName = `rapport-test-${formattedTestData?.testCode || 'nouveau'}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error);
    }
  };
  // Préparation des photos pour les sections (mise en cache avec useMemo)
  const formattedPhotos = useMemo(() => {
    const photos = {};
    if (selectedPhotos) {
      // Transformation de la structure des photos
      Object.keys(selectedPhotos).forEach(sectionKey => {
        if (selectedPhotos[sectionKey]) {
          // Pour la section curves, préserver la structure hiérarchique
          if (sectionKey === 'curves' && typeof selectedPhotos[sectionKey] === 'object' && !Array.isArray(selectedPhotos[sectionKey])) {
            photos[sectionKey] = selectedPhotos[sectionKey]; // Préserver la structure
          }
          // Pour les autres sections qui utilisent des sous-catégories
          else if (typeof selectedPhotos[sectionKey] === 'object' && !Array.isArray(selectedPhotos[sectionKey])) {
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
      // Inclure directement les résultats pour la ControlSection
      results: reportData.results || reportData.resultsData?.results || [],
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
    <Modal show={show} onHide={handleClose} size="xl" fullscreen>
      <Modal.Header closeButton>
        <Modal.Title>Aperçu du rapport</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="report-container" ref={reportRef}>
          {/* Page de garde (toujours affichée en première page) */}
          <div className="report-page" style={{ 
            padding: '20px', 
            minHeight: '297mm',
            width: '210mm',
            margin: '0 auto 20px auto',
            position: 'relative',
            pageBreakAfter: 'always',
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            border: '1px solid #ddd'
          }}>
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
              width: '210mm',
              margin: '0 auto 20px auto',
              position: 'relative',
              pageBreakAfter: 'always',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              border: '1px solid #ddd'
            }}>
              
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
              width: '210mm',
              margin: '0 auto 20px auto',
              position: 'relative',
              pageBreakAfter: 'always',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              border: '1px solid #ddd'
            }}>
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
              width: '210mm',
              margin: '0 auto 20px auto',
              position: 'relative',
              pageBreakAfter: 'always',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              border: '1px solid #ddd'
            }}>
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
              width: '210mm',
              margin: '0 auto 20px auto',
              position: 'relative',
              pageBreakAfter: 'always',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              border: '1px solid #ddd'
            }}>              <CurvesSection 
                testData={formattedTestData} 
                selectedPhotos={formattedPhotos || selectedPhotos}
                clientData={reportData?.client}
              />
            </div>
          )}
            {/* Section Micrography sur une nouvelle page */}
          {selectedSections.micrography && (
            <div className="report-page" style={{ 
              padding: '20px', 
              minHeight: '297mm',
              width: '210mm',
              margin: '0 auto 20px auto',
              position: 'relative',
              pageBreakAfter: 'always',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              border: '1px solid #ddd'
            }}>              <MicrographySection 
                testData={formattedTestData} 
                selectedPhotos={formattedPhotos || selectedPhotos}
                clientData={clientData}
              />
            </div>
          )}            {/* Section Control */}
          {selectedSections.control && (
            <div className="report-page" style={{ 
              padding: '20px', 
              minHeight: '297mm',
              width: '210mm',
              margin: '0 auto 20px auto',
              position: 'relative',
              pageBreakAfter: 'always',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              border: '1px solid #ddd'
            }}>              <ControlSection 
                testData={formattedTestData} 
                partData={reportData.part || {}}
                clientData={clientData}
              />
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
