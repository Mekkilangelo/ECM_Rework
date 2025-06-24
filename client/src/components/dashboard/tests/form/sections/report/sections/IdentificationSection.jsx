// src/components/report-sections/IdentificationSection.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIdCard, faRuler, faWeight, faTag, faCogs, faImage, faBox, faUser, faCalendarAlt, faFlask, faTachometerAlt } from '@fortawesome/free-solid-svg-icons';
import fileService from '../../../../../../../services/fileService';

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

  // Fonction pour récupérer les photos sélectionnées pour cette section
  const getSelectedPhotosForSection = (category, subcategory) => {
    if (!selectedPhotos || !selectedPhotos[category] || !selectedPhotos[category][subcategory]) {
      return [];
    }
    
    const selectedIds = selectedPhotos[category][subcategory];
    const allPhotos = [...(part.photos || []), ...(test.photos || [])];
    
    return allPhotos.filter(photo => 
      photo.category === category && 
      photo.subcategory === subcategory && 
      selectedIds.includes(photo.id)
    );
  };
  
  // Récupérer les photos de pièce principales (vues de face)
  const frontPhotos = getSelectedPhotosForSection('part', 'front');
  const profilePhotos = getSelectedPhotosForSection('part', 'profile');
  
  // Fonction pour obtenir l'URL d'une photo
  const getPhotoUrl = (photoId) => {
    return `/api/files/${photoId}`;
  };
  
  // Obtenir les photos sélectionnées pour cette section
  const sectionPhotos = selectedPhotos.identification || [];
  
  // Récupération des photos sélectionnées pour cette section (même logique que LoadSection)
  let identificationPhotos = [];
  
  if (selectedPhotos) {
    if (selectedPhotos.identification) {
      // Si c'est déjà un tableau
      if (Array.isArray(selectedPhotos.identification)) {
        identificationPhotos = selectedPhotos.identification;
      }
      // Si c'est un objet avec sous-catégories
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
  
  // Fonction pour obtenir l'URL d'une photo avec débogage
  const getPhotoUrlWithDebug = (photoId) => {
    // Utiliser le service de fichier pour obtenir l'URL
    return fileService.getFilePreviewUrl(photoId);
  };
  // Déboguer les informations sur les photos
  console.log("IdentificationSection - selectedPhotos:", selectedPhotos);
  console.log("IdentificationSection - identificationPhotos (après traitement):", identificationPhotos);
  
  // Calculer le nombre de photos par page pour optimiser l'affichage A4
  const calculatePhotosPerPage = (totalPhotos) => {
    if (totalPhotos === 0) return { pages: 0, photosPerPage: 0 };
    
    // Avec les informations en haut, on peut afficher :
    // - 1 photo : grande (300px de hauteur)
    // - 2 photos : moyennes (250px de hauteur) 
    // - 3-4 photos : petites (200px de hauteur)
    // - 5-6 photos : très petites (150px de hauteur)
    
    const maxPhotosPerPage = 6; // Maximum pour tenir sur une page A4
    const pages = Math.ceil(totalPhotos / maxPhotosPerPage);
    const photosPerPage = Math.ceil(totalPhotos / pages);
    
    return { pages, photosPerPage };
  };
  
  const { pages: totalPages, photosPerPage } = calculatePhotosPerPage(identificationPhotos.length);
  
  // Diviser les photos en pages
  const photoPages = [];
  for (let i = 0; i < totalPages; i++) {
    const startIndex = i * photosPerPage;
    const endIndex = Math.min(startIndex + photosPerPage, identificationPhotos.length);
    photoPages.push(identificationPhotos.slice(startIndex, endIndex));
  }
  
  // Fonction pour déterminer la taille des photos selon leur nombre sur la page
  const getPhotoSize = (photosOnPage) => {
    if (photosOnPage === 1) return { height: '300px', cols: 1 };
    if (photosOnPage === 2) return { height: '250px', cols: 2 };
    if (photosOnPage <= 4) return { height: '200px', cols: 2 };
    return { height: '150px', cols: 3 }; // 5-6 photos
  };
  
  // Render d'une page avec les informations en haut et les photos en bas
  const renderPage = (pagePhotos, pageIndex, isFirstPage = false) => {
    const { height: photoHeight, cols } = getPhotoSize(pagePhotos.length);
    
    return (
      <div 
        key={`page-${pageIndex}`}
        style={{ 
          minHeight: '100vh', 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          padding: '20px',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          pageBreakAfter: pageIndex < totalPages - 1 ? 'always' : 'auto'
        }}
      >
        {/* Header avec informations (affiché sur chaque page) */}
        <div style={{
          background: 'linear-gradient(135deg, #d32f2f 0%, #f57c00 50%, #ff9800 100%)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(211, 47, 47, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Motif décoratif */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '100%',
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            borderRadius: '50%',
            transform: 'translateX(50px)'
          }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div>
              <h1 style={{ 
                color: 'white', 
                fontSize: '28px', 
                fontWeight: 'bold', 
                margin: '0 0 5px 0',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FontAwesomeIcon icon={faIdCard} />
                PART IDENTIFICATION
              </h1>
              {isFirstPage && (
                <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', fontWeight: '500' }}>
                  <FontAwesomeIcon icon={faBox} style={{ marginRight: '8px' }} />
                  {part.designation || 'Part designation not specified'}
                </div>
              )}
            </div>
            
            <div style={{ 
              background: 'rgba(255,255,255,0.15)', 
              borderRadius: '8px', 
              padding: '15px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <img 
                src="/images/logoECM.png" 
                alt="Logo ECM" 
                style={{ height: '50px', width: 'auto', filter: 'brightness(0) invert(1)' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div style={{ 
                display: 'none', 
                color: 'white', 
                fontWeight: 'bold', 
                fontSize: '20px',
                textAlign: 'center',
                padding: '15px'
              }}>
                ECM
              </div>
            </div>
          </div>
          
          {/* Info dans le header comme CoverPage */}
          <div style={{ 
            marginTop: '20px', 
            display: 'flex', 
            gap: '25px', 
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 1,
            fontSize: '14px'
          }}>            <div style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FontAwesomeIcon icon={faUser} />
              <span style={{ fontWeight: '600' }}>Client:</span>
              <span>{clientData?.name || testData?.client_name || 'Not specified'}</span>
              {(clientData?.country || testData?.client_country) && (
                <>
                  <span style={{ margin: '0 4px', opacity: 0.7 }}>•</span>
                  <span>{clientData?.country || testData?.client_country}</span>
                </>
              )}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FontAwesomeIcon icon={faCogs} />
              <span style={{ fontWeight: '600' }}>Treatment:</span>
              <span>{testData?.processType || testData?.process_type || 'Not specified'}</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FontAwesomeIcon icon={faFlask} />
              <span style={{ fontWeight: '600' }}>Trial N°:</span>
              <span>{testData?.testCode || testData?.test_code || 'Not specified'}</span>
              <span style={{ margin: '0 4px', opacity: 0.7 }}>•</span>
              <FontAwesomeIcon icon={faCalendarAlt} />
              <span>
                {testData?.testDate || testData?.test_date 
                  ? new Date(testData.testDate || testData.test_date).toLocaleDateString('en-US') 
                  : 'Not specified'}
              </span>
            </div>
          </div>
        </div>

        {/* Informations détaillées (première page uniquement) */}
        {isFirstPage && (
          <div style={{ marginBottom: '30px' }}>
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
              }}>                <h3 style={{ 
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
          </div>
        )}

        {/* Section des photos */}
        {pagePhotos.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e8f5e8',
            flex: 1
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
              {totalPages > 1 && (
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 'normal', 
                  color: '#666',
                  background: '#e8f5e8',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  Page {pageIndex + 1} of {totalPages}
                </span>
              )}
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: '20px',
              justifyItems: 'center'
            }}>
              {pagePhotos.map((photoId, index) => (
                <div key={photoId} style={{
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
                    src={getPhotoUrlWithDebug(photoId)}
                    alt={`Part photo ${(pageIndex * photosPerPage) + index + 1}`} 
                    style={{
                      width: '100%',
                      height: photoHeight,
                      objectFit: 'contain',
                      backgroundColor: '#f8f9fa',
                      display: 'block'
                    }}
                    onError={(e) => {
                      console.error(`Image loading error: ${e.target.src}`);
                      
                      const alternateUrl = `/api/files/${photoId}`;
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
                      Photo {(pageIndex * photosPerPage) + index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '30px',
          paddingTop: '15px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
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
            Page {pageIndex + 1} {totalPages > 1 && `of ${totalPages}`}
          </div>
        </div>
      </div>
    );
  };
  
  // Si pas de photos, afficher une seule page avec les informations
  if (identificationPhotos.length === 0) {
    return renderPage([], 0, true);
  }
  
  // Sinon, afficher toutes les pages nécessaires
  return (
    <>
      {photoPages.map((pagePhotos, pageIndex) => 
        renderPage(pagePhotos, pageIndex, pageIndex === 0)
      )}
    </>
  );
};

export default IdentificationSection;
