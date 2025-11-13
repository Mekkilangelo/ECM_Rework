import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicroscope } from '@fortawesome/free-solid-svg-icons';
import fileService from '../../../../../../../services/fileService';
import SectionHeader from './common/SectionHeader';

const MicrographySection = ({ testData, selectedPhotos = {}, clientData }) => {
  // Retrieve photos with metadata support
  let micrographyPhotos = [];
  
  if (selectedPhotos) {
    if (selectedPhotos.micrography) {
      // If it's already an array
      if (Array.isArray(selectedPhotos.micrography)) {
        micrographyPhotos = selectedPhotos.micrography;
      }
      // If it's an object with subcategories (new structure with metadata)
      else if (typeof selectedPhotos.micrography === 'object') {
        // Gather all photos from all subcategories
        Object.values(selectedPhotos.micrography).forEach(subcategoryPhotos => {
          if (Array.isArray(subcategoryPhotos)) {
            micrographyPhotos = [...micrographyPhotos, ...subcategoryPhotos];
          }
        });
      }
    }
  }
      // Function to get photo URL with metadata support
  const getPhotoUrl = (photo) => {
    if (photo && typeof photo === 'object' && photo.id) {
      return fileService.getFilePreviewUrl(photo.id);
    }
    return fileService.getFilePreviewUrl(photo);
  };  
  // Function to get photo ID
  const getPhotoId = (photo) => {
    return photo && typeof photo === 'object' ? photo.id : photo;
  };

  // Function to extract photo metadata
  const extractPhotoMetadata = (photo) => {
    if (photo && typeof photo === 'object') {
      const category = photo.category || photo.originalData?.category || '';
      const subcategory = photo.subcategory || photo.originalData?.subcategory || '';
      
      // Extract resultIndex, sampleIndex, and magnification from subcategory
      // Format: "result-0-sample-1-x100"
      const match = subcategory.match(/result-(\d+)-sample-(\d+)-(.+)/);
      const resultIndex = match ? parseInt(match[1]) : 0;
      const sampleIndex = match ? parseInt(match[2]) : 0;
      const magnification = match ? match[3] : 'other';
      
      return {
        resultIndex,
        sampleIndex,
        magnification,
        category,
        subcategory
      };
    }
    return { resultIndex: 0, sampleIndex: 0, magnification: 'other', category: '', subcategory: '' };
  };
  // Organize photos by result > sample > magnification
  const organizePhotosByHierarchy = (photos) => {
    const organized = {};
    
    photos.forEach(photo => {
      const metadata = extractPhotoMetadata(photo);
      const { resultIndex, sampleIndex, magnification } = metadata;
      
      const resultKey = `result-${resultIndex}`;
      const sampleKey = `sample-${sampleIndex}`;
      
      if (!organized[resultKey]) {
        organized[resultKey] = {
          resultIndex,
          description: '', // Will be filled from testData if available
          samples: {}
        };
      }
      
      if (!organized[resultKey].samples[sampleKey]) {
        organized[resultKey].samples[sampleKey] = {
          sampleIndex,
          description: '', // Will be filled from testData if available
          magnifications: {}
        };
      }
      
      if (!organized[resultKey].samples[sampleKey].magnifications[magnification]) {
        organized[resultKey].samples[sampleKey].magnifications[magnification] = [];
      }
      
      organized[resultKey].samples[sampleKey].magnifications[magnification].push(photo);
    });

    // Enrich with descriptions from testData
    if (testData && testData.results_data && testData.results_data.results) {
      Object.keys(organized).forEach(resultKey => {
        const resultData = organized[resultKey];
        const testResult = testData.results_data.results[resultData.resultIndex];
        
        if (testResult) {
          resultData.description = testResult.description || `Result ${resultData.resultIndex + 1}`;
          
          Object.keys(resultData.samples).forEach(sampleKey => {
            const sampleData = resultData.samples[sampleKey];
            const testSample = testResult.samples && testResult.samples[sampleData.sampleIndex];
            
            if (testSample) {
              sampleData.description = testSample.description || `Sample ${sampleData.sampleIndex + 1}`;
            } else {
              sampleData.description = `Sample ${sampleData.sampleIndex + 1}`;
            }
          });
        } else {
          resultData.description = `Result ${resultData.resultIndex + 1}`;
        }
      });
    }
    
    return organized;
  };
  // Function to format magnification name
  const formatMagnificationName = (magnification) => {
    const magnificationNames = {
      'x50': 'Magnification x50',
      'x500': 'Magnification x500', 
      'x1000': 'Magnification x1000',
      'other': 'Other magnifications'
    };
    return magnificationNames[magnification] || magnification;
  };

  // Organize photos by hierarchy
  const organizedPhotos = organizePhotosByHierarchy(micrographyPhotos);
  const hasPhotos = Object.keys(organizedPhotos).length > 0;

  // Estimation intelligente des hauteurs pour chaque section
  const estimateSectionHeight = (sectionType, data) => {
    switch (sectionType) {
      case 'resultHeader':
        return 35; // Header du résultat encore plus compact
      
      case 'sampleHeader':
        return 30; // Header de l'échantillon encore plus compact
      
      case 'magnificationGroup':
        if (!data || !data.photos) return 0;
        
        const photosCount = data.photos.length;
        let photoHeight = 0;
        
        // Calcul optimisé et plus précis de la hauteur basée sur le nombre de photos
        if (photosCount === 1) {
          photoHeight = 250; // 220px photo + 30px caption
        } else if (photosCount === 2) {
          photoHeight = 190; // 160px photo + 30px caption
        } else if (photosCount <= 4) {
          photoHeight = 180; // 140px photo + 40px caption, disposition 2x2
        } else if (photosCount <= 6) {
          photoHeight = 170; // Grid 3x2, hauteur optimisée
        } else {
          photoHeight = 160; // Grid dense 3x3
        }
        
        // Nombre de lignes nécessaires pour la grille optimisé
        const cols = photosCount === 1 ? 1 : photosCount === 2 ? 2 : 3;
        const rows = Math.ceil(photosCount / cols);
        
        return Math.max(20, rows * photoHeight); // Minimum 20px, pas de header magnification
      
      case 'emptyState':
        return 200;
      
      default:
        return 100;
    }
  };

  // Flatten the hierarchical structure for intelligent pagination
  const flattenContentForPagination = () => {
    const sections = [];
    
    if (!hasPhotos) {
      sections.push({ type: 'emptyState', data: null });
      return sections;
    }

    Object.keys(organizedPhotos)
      .sort((a, b) => organizedPhotos[a].resultIndex - organizedPhotos[b].resultIndex)
      .forEach((resultKey) => {
        const resultData = organizedPhotos[resultKey];
        
        // Add result header
        sections.push({ 
          type: 'resultHeader', 
          data: resultData,
          key: resultKey
        });
        
        Object.keys(resultData.samples)
          .sort((a, b) => resultData.samples[a].sampleIndex - resultData.samples[b].sampleIndex)
          .forEach((sampleKey) => {
            const sampleData = resultData.samples[sampleKey];
            
            // Add sample header
            sections.push({ 
              type: 'sampleHeader', 
              data: sampleData,
              key: `${resultKey}-${sampleKey}`
            });
            
            Object.keys(sampleData.magnifications)
              .sort()
              .forEach((magnification) => {
                const photos = sampleData.magnifications[magnification];
                
                // Add magnification group
                sections.push({ 
                  type: 'magnificationGroup', 
                  data: { 
                    magnification, 
                    photos,
                    resultData,
                    sampleData
                  },
                  key: `${resultKey}-${sampleKey}-${magnification}`
                });
              });
          });
      });
    
    return sections;
  };

  // Logique de découpage intelligent en pages avec useMemo
  const organizeContentInPages = useMemo(() => {
    const maxPageHeight = 900; // Augmenté pour mieux utiliser l'espace A4
    const headerHeight = 120;
    const footerHeight = 60;
    const availableHeight = maxPageHeight - headerHeight - footerHeight;
    
    const sections = flattenContentForPagination();
    const pages = [];
    let currentPage = { sections: [], estimatedHeight: 0 };
    
    sections.forEach((section, index) => {
      const sectionHeight = estimateSectionHeight(section.type, section.data);
      
      if (sectionHeight === 0) return;
      
      // Logique simplifiée : si la section ne rentre pas, créer une nouvelle page
      const wouldExceedPage = currentPage.estimatedHeight + sectionHeight > availableHeight;
      const hasContent = currentPage.sections.length > 0;
      
      if (wouldExceedPage && hasContent) {
        // Vérifier si la section actuelle est petite et peut être forcée sur la page actuelle
        if (sectionHeight <= availableHeight * 0.3 && currentPage.estimatedHeight <= availableHeight * 0.8) {
          // Force la section sur la page actuelle si elle est petite
          currentPage.sections.push(section);
          currentPage.estimatedHeight += sectionHeight + 20; // Espacement réduit
        } else {
          // Sinon, créer une nouvelle page
          pages.push(currentPage);
          currentPage = { sections: [section], estimatedHeight: sectionHeight + 20 };
        }
      } else {
        // La section rentre dans la page actuelle
        currentPage.sections.push(section);
        currentPage.estimatedHeight += sectionHeight + 20; // Espacement réduit entre sections
      }
    });
    
    // Ajouter la dernière page si elle contient du contenu
    if (currentPage.sections.length > 0) {
      pages.push(currentPage);
    }
    
    // S'assurer qu'on a au moins une page
    return pages.length > 0 ? pages : [{ sections: [{ type: 'emptyState', data: null }], estimatedHeight: 400 }];
  }, [organizedPhotos, hasPhotos]);

  // Fonction pour créer le header de page
  const createPageHeader = (pageIndex, isFirstPage = false) => (
    <div key={`header-${pageIndex}`}>
      {isFirstPage ? (
        <SectionHeader
          title="MICROGRAPHIC ANALYSIS"
          subtitle="Metallographic examination and microstructural analysis"
          icon={faMicroscope}
          testData={testData}
          clientData={clientData}
          sectionType="micrography"
          showSubtitle={true}
        />
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)',
          borderRadius: '8px',
          padding: '15px 25px',
          marginBottom: '25px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(56, 142, 60, 0.3)'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FontAwesomeIcon icon={faMicroscope} />
            MICROGRAPHIC ANALYSIS (continued)
            <span style={{ fontSize: '16px', opacity: 0.9, marginLeft: 'auto' }}>
              Page {pageIndex + 1}
            </span>
          </h2>
        </div>
      )}
    </div>
  );

  // Fonction pour créer le footer de page
  const createPageFooter = (pageIndex, totalPages) => (
    <div key={`footer-${pageIndex}`} style={{
      marginTop: 'auto',
      paddingTop: '20px',
      borderTop: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
      color: '#666'
    }}>
      <div>
        <strong>Micrographic Analysis</strong> - ECM Industrial Analysis
      </div>
      <div>
        {new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </div>
      <div>
        Page {pageIndex + 1} of {totalPages}
      </div>
    </div>
  );

  // Fonction de rendu pour header de résultat
  const renderResultHeader = (resultData) => (
    <div style={{
      marginBottom: '8px',
      padding: '6px 15px',
      background: 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)',
      borderRadius: '4px',
      color: 'white',
      boxShadow: '0 2px 4px rgba(56, 142, 60, 0.3)'
    }}>
      <h2 style={{
        margin: 0,
        fontSize: '16px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <FontAwesomeIcon icon={faMicroscope} />
        Result {resultData.resultIndex + 1}
        {resultData.description && (
          <span style={{ 
            fontSize: '13px', 
            fontWeight: '400',
            opacity: 0.9
          }}>
            - {resultData.description}
          </span>
        )}
      </h2>
    </div>
  );

  // Fonction de rendu pour header d'échantillon
  const renderSampleHeader = (sampleData) => (
    <div style={{
      marginBottom: '8px',
      padding: '4px 12px',
      background: 'linear-gradient(135deg, #5e35b1 0%, #7e57c2 100%)',
      borderRadius: '4px',
      color: 'white',
      boxShadow: '0 1px 3px rgba(94, 53, 177, 0.3)'
    }}>
      <h3 style={{
        margin: 0,
        fontSize: '14px',
        fontWeight: '600'
      }}>
        Sample {sampleData.sampleIndex + 1}
        {sampleData.description && (
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '400',
            opacity: 0.9,
            marginLeft: '6px'
          }}>
            - {sampleData.description}
          </span>
        )}
      </h3>
    </div>
  );

  // Fonction de rendu pour groupe de magnification
  const renderMagnificationGroup = (data) => {
    const { magnification, photos, resultData, sampleData, pageIndex = 0, totalPhotoPages = 1 } = data;
    
    return (
      <div style={{ marginBottom: '8px' }}>
        {/* Photo grid for this magnification - titre supprimé car redondant avec le badge sur chaque image */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: photos.length === 1 
            ? '1fr' 
            : photos.length === 2 
              ? 'repeat(2, 1fr)' 
              : photos.length <= 4
                ? 'repeat(2, 1fr)'
                : 'repeat(3, 1fr)',
          gap: '10px',
          marginBottom: '8px'
        }}>
          {photos.map((photo, photoIndex) => (
            <div key={`${getPhotoId(photo)}-${photoIndex}`} 
                 style={{ 
                   border: '1px solid #e0e0e0',
                   borderRadius: '6px',
                   overflow: 'hidden',
                   backgroundColor: '#fff',
                   boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                   transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                 }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src={getPhotoUrl(photo)}
                  alt={`Micrograph ${formatMagnificationName(magnification)} - Result ${resultData.resultIndex + 1} - Sample ${sampleData.sampleIndex + 1} - ${photoIndex + 1}`}
                  style={{
                    width: '100%',
                    height: photos.length === 1 ? '220px' : photos.length === 2 ? '160px' : '140px',
                    objectFit: 'contain',
                    backgroundColor: '#f8f9fa'
                  }}
                  onError={(e) => {
                    console.error(`Image loading error: ${e.target.src}`);
                    
                    // Try with alternative URL
                    const alternateUrl = `/api/files/${getPhotoId(photo)}`;
                    
                    if (e.target.src !== alternateUrl) {
                      
                      e.target.src = alternateUrl;
                      return;
                    }
                    
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                  }}
                />
              </div>
              <div style={{ 
                padding: '6px 8px', 
                borderTop: '1px solid #e0e0e0',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
              }}>
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#333', 
                    fontWeight: '600' 
                  }}>
                    R{resultData.resultIndex + 1}-S{sampleData.sampleIndex + 1}-{photoIndex + 1}
                  </div>
                  <div style={{ 
                    fontSize: '9px', 
                    color: '#fff', 
                    backgroundColor: '#1976d2',
                    padding: '1px 4px',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}>
                    {magnification}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Fonction de rendu pour état vide
  const renderEmptyState = () => (
    <div style={{ 
      padding: '60px 20px', 
      textAlign: 'center', 
      color: '#6c757d',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      border: '2px dashed #dee2e6',
      borderRadius: '12px'
    }}>
      <div style={{ 
        fontSize: '48px', 
        marginBottom: '20px',
        color: '#bbb'
      }}>
        <FontAwesomeIcon icon={faMicroscope} />
      </div>
      <div style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        marginBottom: '10px',
        color: '#495057'
      }}>
        No micrographs available
      </div>
      <div style={{ 
        fontSize: '14px',
        lineHeight: '1.5'
      }}>
        No metallographic analysis was performed for this test.
      </div>
    </div>
  );

  // Fonction de rendu de section par type
  const renderSectionByType = (section) => {
    switch (section.type) {
      case 'resultHeader':
        return renderResultHeader(section.data);
      case 'sampleHeader':
        return renderSampleHeader(section.data);
      case 'magnificationGroup':
        return renderMagnificationGroup(section.data);
      case 'emptyState':
        return renderEmptyState();
      default:
        return null;
    }
  };

  // Rendu principal avec découpage intelligent
  return (
    <>
      {organizeContentInPages.map((page, pageIndex) => (
        <div key={`micrography-page-${pageIndex}`} style={{ 
          minHeight: '297mm',
          maxHeight: '297mm', 
          width: '210mm',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          padding: '10mm',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          pageBreakAfter: pageIndex < organizeContentInPages.length - 1 ? 'always' : 'auto',
          pageBreakInside: 'avoid',
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header de page */}
          {createPageHeader(pageIndex, pageIndex === 0)}
          
          {/* Contenu de la page dans une boîte blanche */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            border: '1px solid #e9ecef',
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ 
              flex: 1,
              display: 'grid', 
              gap: '15px', // Réduit de 20px à 15px
              alignContent: 'start',
              overflow: 'hidden'
            }}>
              {page.sections.map((section, sectionIndex) => (
                <div key={`${section.key || section.type}-${sectionIndex}`}>
                  {renderSectionByType(section)}
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer de page */}
          {createPageFooter(pageIndex, organizeContentInPages.length)}
        </div>
      ))}
    </>
  );
};

export default MicrographySection;
