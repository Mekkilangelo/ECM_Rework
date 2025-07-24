// src/components/report-sections/IdentificationSection.jsx
import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIdCard, faRuler, faWeight, faTag, faCogs, faImage, faBox, faUser, faCalendarAlt, faFlask, faTachometerAlt } from '@fortawesome/free-solid-svg-icons';
import fileService from '../../../../../../../services/fileService';
import SectionHeader from './common/SectionHeader';

const IdentificationSection = ({ testData, partData, clientData, selectedPhotos = {} }) => {
  // Vérification de sécurité pour éviter les erreurs
  const test = testData || {};
  const part = partData || {};
  
  // Fonction améliorée pour formater les dimensions de façon plus complète
  const formatDimensions = () => {
    const dimensions = part.dimensions || {};
    const dimensionItems = [];
    
    // Dimensions rectangulaires
    if (dimensions.rectangular) {
      if (dimensions.rectangular.length) {
        dimensionItems.push(`L: ${dimensions.rectangular.length} ${dimensions.rectangular.unit || 'mm'}`);
      }
      if (dimensions.rectangular.width) {
        dimensionItems.push(`l: ${dimensions.rectangular.width} ${dimensions.rectangular.unit || 'mm'}`);
      }
      if (dimensions.rectangular.height) {
        dimensionItems.push(`H: ${dimensions.rectangular.height} ${dimensions.rectangular.unit || 'mm'}`);
      }
    }
    
    // Dimensions circulaires
    if (dimensions.circular) {
      if (dimensions.circular.diameterOut) {
        dimensionItems.push(`Ø ext: ${dimensions.circular.diameterOut} ${dimensions.circular.unit || 'mm'}`);
      }
      if (dimensions.circular.diameterIn) {
        dimensionItems.push(`Ø int: ${dimensions.circular.diameterIn} ${dimensions.circular.unit || 'mm'}`);
      }
    }
    
    // Vérifier si le format de dimensions est l'ancien (plat)
    if (dimensions.length && dimensions.length.value) {
      dimensionItems.push(`L: ${dimensions.length.value} ${dimensions.length.unit || 'mm'}`);
    }
    if (dimensions.width && dimensions.width.value) {
      dimensionItems.push(`l: ${dimensions.width.value} ${dimensions.width.unit || 'mm'}`);
    }
    if (dimensions.height && dimensions.height.value) {
      dimensionItems.push(`H: ${dimensions.height.value} ${dimensions.height.unit || 'mm'}`);
    }
    if (dimensions.diameter && dimensions.diameter.value) {
      dimensionItems.push(`Ø: ${dimensions.diameter.value} ${dimensions.diameter.unit || 'mm'}`);
    }
    
    return dimensionItems.length > 0 ? dimensionItems.join(', ') : 'Not specified';
  };

  // Format pour le poids
  const formatWeight = () => {
    const dimensions = part.dimensions || {};
    if (dimensions.weight && dimensions.weight.value !== undefined) {
      // Vérifier si l'unité est en grammes et convertir en kg si nécessaire
      let value = dimensions.weight.value;
      let unit = dimensions.weight.unit || 'kg';
      
      // Si l'unité est en grammes, convertir en kg
      if (unit.toLowerCase() === 'g') {
        value = value / 1000;
        unit = 'kg';
      }
        return `${value} ${unit}`;
    }
    return 'Not specified';
  };

  // Récupération des photos sélectionnées pour cette section (avec support des métadonnées)
  let identificationPhotos = [];
  
  if (selectedPhotos) {
    if (selectedPhotos.identification) {
      // Si c'est déjà un tableau
      if (Array.isArray(selectedPhotos.identification)) {
        identificationPhotos = selectedPhotos.identification;
      }
      // Si c'est un objet avec sous-catégories (nouvelle structure avec métadonnées)
      else if (typeof selectedPhotos.identification === 'object') {
        // Rassembler toutes les photos de toutes les sous-catégories
        Object.values(selectedPhotos.identification).forEach(subcategoryPhotos => {
          if (Array.isArray(subcategoryPhotos)) {
            identificationPhotos = [...identificationPhotos, ...subcategoryPhotos];
          }
        });
      }
    }
  }
  
  // Fonction pour obtenir l'URL d'une photo avec support des métadonnées et débogage
  const getPhotoUrlWithDebug = (photo) => {
    // Si c'est un objet avec métadonnées
    if (photo && typeof photo === 'object' && photo.id) {
      return fileService.getFilePreviewUrl(photo.id);
    }
    // Si c'est juste un ID
    return fileService.getFilePreviewUrl(photo);
  };
  
  // Fonction pour obtenir l'ID d'une photo
  const getPhotoId = (photo) => {
    return photo && typeof photo === 'object' ? photo.id : photo;
  };

  // Estimation intelligente des hauteurs pour chaque section
  const estimateSectionHeight = (sectionType, data) => {
    switch (sectionType) {
      case 'partDetails':
        // Informations de base de la pièce
        let baseHeight = 250;
        if (part.comments || (test.loadData && test.loadData.comments)) {
          baseHeight += 120; // Ajouter de la place pour les commentaires
        }
        return baseHeight;
      
      case 'photos':
        if (!data || data.length === 0) return 0;
        
        // Calcul basé sur le nombre de photos et leur taille optimale
        const photosCount = data.length;
        let photoHeight = 0;
        
        if (photosCount === 1) {
          photoHeight = 320; // 300px photo + padding
        } else if (photosCount === 2) {
          photoHeight = 270; // 250px photo + padding
        } else if (photosCount <= 4) {
          photoHeight = 220; // 200px photo + padding
        } else {
          photoHeight = 170; // 150px photo + padding
        }
        
        // Nombre de lignes nécessaires
        const cols = photosCount === 1 ? 1 : photosCount === 2 ? 2 : photosCount <= 4 ? 2 : 3;
        const rows = Math.ceil(photosCount / cols);
        
        return 100 + (rows * photoHeight); // Header + photos
      
      default:
        return 150;
    }
  };

  // Logique de découpage intelligent en pages avec useMemo
  const organizeContentInPages = useMemo(() => {
    const maxPageHeight = 800;
    const headerHeight = 120;
    const footerHeight = 60;
    const availableHeight = maxPageHeight - headerHeight - footerHeight;
    
    const sections = [
      { type: 'partDetails', data: part },
      { type: 'photos', data: identificationPhotos }
    ];

    const pages = [];
    let currentPage = { sections: [], estimatedHeight: 0 };
    
    sections.forEach(section => {
      const sectionHeight = estimateSectionHeight(section.type, section.data);
      
      if (sectionHeight === 0) return;
      
      // Si l'ajout de cette section dépasse la hauteur disponible et qu'on a déjà du contenu
      if (currentPage.estimatedHeight + sectionHeight > availableHeight && currentPage.sections.length > 0) {
        pages.push(currentPage);
        currentPage = { sections: [], estimatedHeight: 0 };
      }
      
      // Si c'est des photos et qu'il y en a beaucoup, les diviser intelligemment
      if (section.type === 'photos' && section.data.length > 6) {
        const photosPerPage = 6;
        const photoPages = Math.ceil(section.data.length / photosPerPage);
        
        for (let i = 0; i < photoPages; i++) {
          const startIndex = i * photosPerPage;
          const endIndex = Math.min(startIndex + photosPerPage, section.data.length);
          const pagePhotos = section.data.slice(startIndex, endIndex);
          
          const pagePhotoHeight = estimateSectionHeight('photos', pagePhotos);
          
          if (currentPage.estimatedHeight + pagePhotoHeight > availableHeight && currentPage.sections.length > 0) {
            pages.push(currentPage);
            currentPage = { sections: [], estimatedHeight: 0 };
          }
          
          currentPage.sections.push({
            type: 'photos',
            data: pagePhotos,
            pageIndex: i,
            totalPhotoPages: photoPages
          });
          currentPage.estimatedHeight += pagePhotoHeight + 30;
          
          // Si c'est la dernière page de photos ou si on approche de la limite, finir cette page
          if (i === photoPages - 1 || currentPage.estimatedHeight > availableHeight * 0.8) {
            pages.push(currentPage);
            currentPage = { sections: [], estimatedHeight: 0 };
          }
        }
      } else {
        currentPage.sections.push(section);
        currentPage.estimatedHeight += sectionHeight + 30;
      }
    });
    
    if (currentPage.sections.length > 0) {
      pages.push(currentPage);
    }
    
    // S'assurer qu'on a au moins une page
    return pages.length > 0 ? pages : [{ sections: [{ type: 'partDetails', data: part }], estimatedHeight: 400 }];
  }, [part, identificationPhotos, test]);

  // Fonction pour créer le header de page
  const createPageHeader = (pageIndex, isFirstPage = false) => (
    <div key={`header-${pageIndex}`}>
      {isFirstPage ? (
        <SectionHeader
          title="PART IDENTIFICATION"
          subtitle={part.designation || 'Part designation not specified'}
          icon={faIdCard}
          testData={testData}
          clientData={clientData}
          sectionType="identification"
          showSubtitle={true}
        />
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
          borderRadius: '8px',
          padding: '15px 25px',
          marginBottom: '25px',
          color: 'white',
          boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FontAwesomeIcon icon={faIdCard} />
            PART IDENTIFICATION (continued)
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
        <strong>Part Identification</strong> - ECM Industrial Analysis
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

  // Fonction de rendu des détails de la pièce
  const renderPartDetails = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
        {/* Colonne gauche - Informations principales */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #ffebee'
        }}>
          <h3 style={{ 
            color: '#d32f2f', 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FontAwesomeIcon icon={faTag} style={{ color: '#f44336' }} />
            Part Details
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              <span style={{ fontWeight: '600', color: '#424242' }}>Designation:</span>
              <span style={{ color: '#666', maxWidth: '60%', textAlign: 'right' }}>
                {part.designation || 'Not specified'}
                {part.clientDesignation && <div style={{ color: '#999', fontSize: '13px', fontStyle: 'italic' }}>({part.clientDesignation})</div>}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              <span style={{ fontWeight: '600', color: '#424242' }}>Reference:</span>
              <span style={{ color: '#666', maxWidth: '60%', textAlign: 'right' }}>{part.reference || 'Not specified'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              <span style={{ fontWeight: '600', color: '#424242' }}>Quantity:</span>
              <span style={{ color: '#666', maxWidth: '60%', textAlign: 'right' }}>{part.quantity || 'Not specified'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontWeight: '600', color: '#424242' }}>Material:</span>
              <span style={{ color: '#666', maxWidth: '60%', textAlign: 'right' }}>{part.steel || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {/* Colonne droite - Dimensions et poids */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #fff8e1'
        }}>
          <h3 style={{ 
            color: '#f57c00', 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FontAwesomeIcon icon={faRuler} style={{ color: '#ff9800' }} />
            Physical Properties
          </h3>
          
          {/* Section Poids */}
          <div style={{ 
            background: '#fffbf0', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '15px',
            border: '1px solid #ffe0b2'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FontAwesomeIcon icon={faWeight} style={{ fontSize: '16px', color: '#f57c00' }} />
              <span style={{ fontWeight: '700', color: '#e65100', fontSize: '15px' }}>Weight</span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
              {formatWeight()}
            </div>
          </div>

          {/* Section Dimensions */}
          <div style={{ 
            background: '#fffbf0', 
            borderRadius: '8px', 
            padding: '15px',
            border: '1px solid #ffe0b2'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FontAwesomeIcon icon={faRuler} style={{ fontSize: '16px', color: '#f57c00' }} />
              <span style={{ fontWeight: '700', color: '#e65100', fontSize: '15px' }}>Dimensions</span>
            </div>
            
            {(() => {
              const dimensions = part.dimensions || {};
              const formattedDims = formatDimensions();
              
              // Si on a des dimensions détaillées, les afficher de manière structurée
              if (formattedDims !== 'Not specified') {
                const dimArray = formattedDims.split(', ');
                return (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {dimArray.map((dim, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        background: index % 2 === 0 ? 'rgba(255,255,255,0.7)' : 'transparent',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}>
                        <span style={{ fontWeight: '500', color: '#666' }}>
                          {dim.split(':')[0]}:
                        </span>
                        <span style={{ fontWeight: '600', color: '#333' }}>
                          {dim.split(':')[1]?.trim()}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              } else {
                return (
                  <div style={{ 
                    color: '#999', 
                    fontStyle: 'italic', 
                    textAlign: 'center',
                    padding: '10px'
                  }}>
                    No dimensions specified
                  </div>
                );
              }
            })()}
          </div>
        </div>
      </div>

      {/* Commentaires (si présents) */}
      {(part.comments || (test.loadData && test.loadData.comments)) && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '25px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #f3e5f5'
        }}>
          <h3 style={{ 
            color: '#7b1fa2', 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <FontAwesomeIcon icon={faCogs} style={{ color: '#ab47bc' }} />
            Comments
          </h3>
          
          {part.comments && (
            <div style={{ 
              padding: '15px',
              background: '#fafafa',
              borderRadius: '8px',
              marginBottom: part.comments && test.loadData?.comments ? '15px' : '0',
              border: '1px solid #e0e0e0'
            }}>
              <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#7b1fa2', marginBottom: '8px' }}>Part Comments:</h5>
              <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>{part.comments}</p>
            </div>
          )}
          
          {test.loadData && test.loadData.comments && (
            <div style={{ 
              padding: '15px',
              background: '#fafafa',
              borderRadius: '8px',
              border: '1px solid #e0e0e0'
            }}>
              <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#7b1fa2', marginBottom: '8px' }}>Load Comments:</h5>
              <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>{test.loadData.comments}</p>
            </div>
          )}
        </div>
      )}
    </>
  );

  // Fonction de rendu des photos avec pagination intelligente
  const renderPhotos = (photos, photoPageIndex = 0, totalPhotoPages = 1) => {
    if (!photos || photos.length === 0) {
      return (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px dashed #dee2e6'
        }}>
          <FontAwesomeIcon icon={faImage} style={{ fontSize: '48px', color: '#ccc', marginBottom: '20px' }} />
          <p style={{ color: '#666', fontSize: '18px', margin: 0 }}>No photos available</p>
        </div>
      );
    }

    // Déterminer la taille optimale des photos
    const photosCount = photos.length;
    let photoHeight, cols;
    
    if (photosCount === 1) {
      photoHeight = '300px';
      cols = 1;
    } else if (photosCount === 2) {
      photoHeight = '250px';
      cols = 2;
    } else if (photosCount <= 4) {
      photoHeight = '200px';
      cols = 2;
    } else {
      photoHeight = '150px';
      cols = 3;
    }

    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '25px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #e8f5e8'
      }}>
        <h3 style={{ 
          color: '#2e7d32', 
          fontSize: '18px', 
          fontWeight: 'bold', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <FontAwesomeIcon icon={faImage} style={{ color: '#4caf50' }} />
          Part Photos
          {totalPhotoPages > 1 && (
            <span style={{ 
              fontSize: '14px', 
              fontWeight: 'normal', 
              color: '#666',
              background: '#e8f5e8',
              padding: '2px 8px',
              borderRadius: '12px'
            }}>
              Photos {photoPageIndex + 1} of {totalPhotoPages}
            </span>
          )}
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '20px',
          justifyItems: 'center'
        }}>
          {photos.map((photo, index) => (
            <div key={getPhotoId(photo)} style={{
              width: '100%',
              maxWidth: cols === 1 ? '400px' : cols === 2 ? '300px' : '250px',
              border: '2px solid #e0e0e0',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s ease',
              background: 'white'
            }}>
              <img 
                src={getPhotoUrlWithDebug(photo)}
                alt={`Part photo ${index + 1}`}
                style={{
                  width: '100%',
                  height: photoHeight,
                  objectFit: 'contain',
                  backgroundColor: '#f8f9fa',
                  display: 'block'
                }}
                onError={(e) => {
                  console.error(`Image loading error: ${e.target.src}`);
                  
                  const alternateUrl = `/api/files/${getPhotoId(photo)}`;
                  if (e.target.src !== alternateUrl) {
                    console.log(`Attempting with alternative URL: ${alternateUrl}`);
                    e.target.src = alternateUrl;
                    return;
                  }
                  
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIgc3Ryb2tlPSIjZGRkIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSIxNTAiIHk9Ijg1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPjxmYXJlYW0gZGF0YS1mYS1pPSJmYS1pbWFnZSI+8J+MhTwvdGV4dD48dGV4dCB4PSIxNTAiIHk9IjExMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjx0ZXh0IHg9IjE1MCIgeT0iMTMwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiNjY2MiPlBob3RvIElEOiAnICsgcGhvdG9JZCArICc8L3RleHQ+PC9zdmc+';
                }}
              />
              <div style={{
                padding: '10px',
                background: '#f8f9fa',
                textAlign: 'center',
                borderTop: '1px solid #e0e0e0'
              }}>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#666',
                  fontWeight: '500'
                }}>
                  Photo {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Fonction de rendu de section par type
  const renderSectionByType = (section) => {
    switch (section.type) {
      case 'partDetails':
        return renderPartDetails();
      case 'photos':
        return renderPhotos(
          section.data, 
          section.pageIndex || 0, 
          section.totalPhotoPages || 1
        );
      default:
        return null;
    }
  };

  // Rendu principal avec découpage intelligent
  return (
    <>
      {organizeContentInPages.map((page, pageIndex) => (
        <div key={`identification-page-${pageIndex}`} style={{ 
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
          
          {/* Contenu de la page */}
          <div style={{ 
            flex: 1,
            display: 'grid', 
            gap: '20px',
            alignContent: 'start',
            overflow: 'hidden'
          }}>
            {page.sections.map((section, sectionIndex) => (
              <div key={`${section.type}-${sectionIndex}`}>
                {renderSectionByType(section)}
              </div>
            ))}
          </div>
          
          {/* Footer de page */}
          {createPageFooter(pageIndex, organizeContentInPages.length)}
        </div>
      ))}
    </>
  );
};

export default IdentificationSection;
