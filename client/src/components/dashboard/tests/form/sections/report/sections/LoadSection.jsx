import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWeightHanging, faUser, faCalendarAlt, faFlask, faCogs, faImage, faBox, faRuler, faWeight, faLayerGroup, faArrowsAlt } from '@fortawesome/free-solid-svg-icons';
import fileService from '../../../../../../../services/fileService';
import SectionHeader from './common/SectionHeader';

const LoadSection = ({ trialData, partData, clientData, selectedPhotos = {} }) => {
  // Vérification de sécurité pour éviter les erreurs si trialData est undefined
  const trial = trialData || {};
  const part = partData || {};

  // Récupérer les données de loadData depuis l'objet trial
  const loadData = trial.loadData || {};
  // Récupération des photos sélectionnées pour cette section (avec support des métadonnées)
  let loadPhotos = [];
  
  if (selectedPhotos) {
    if (selectedPhotos.load) {
      // Si c'est déjà un tableau
      if (Array.isArray(selectedPhotos.load)) {
        loadPhotos = selectedPhotos.load;
      }
      // Si c'est un objet avec sous-catégories (nouvelle structure avec métadonnées)
      else if (typeof selectedPhotos.load === 'object') {
        // Rassembler toutes les photos de toutes les sous-catégories
        Object.values(selectedPhotos.load).forEach(subcategoryPhotos => {
          if (Array.isArray(subcategoryPhotos)) {
            loadPhotos = [...loadPhotos, ...subcategoryPhotos];
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

  // Déboguer les informations sur les photos et les URLs
  
  
  
  if (loadPhotos.length > 0) {
  }
  // Calculer le nombre de photos par page pour optimiser l'affichage A4
  const calculatePhotosPerPage = (totalPhotos) => {
    if (totalPhotos === 0) return { pages: 0, photosPerPage: 0 };
    
    // Pour la section load, privilégier moins de photos mais plus grandes
    // - 1 photo : très grande (350px de hauteur)
    // - 2 photos : grandes (280px de hauteur) 
    // - 3-4 photos : moyennes (220px de hauteur)
    
    const maxPhotosPerPage = 4; // Maximum pour avoir des photos plus grandes
    const pages = Math.ceil(totalPhotos / maxPhotosPerPage);
    const photosPerPage = Math.ceil(totalPhotos / pages);
    
    return { pages, photosPerPage };
  };
  
  const { pages: totalPages, photosPerPage } = calculatePhotosPerPage(loadPhotos.length);
  
  // Diviser les photos en pages
  const photoPages = [];
  for (let i = 0; i < totalPages; i++) {
    const startIndex = i * photosPerPage;
    const endIndex = Math.min(startIndex + photosPerPage, loadPhotos.length);
    photoPages.push(loadPhotos.slice(startIndex, endIndex));
  }
  
  // Fonction pour déterminer la taille des photos selon leur nombre sur la page
  const getPhotoSize = (photosOnPage) => {
    if (photosOnPage === 1) return { height: '350px', cols: 1 };
    if (photosOnPage === 2) return { height: '280px', cols: 2 };
    return { height: '220px', cols: 2 }; // 3-4 photos
  };

  // Fonction pour formater le poids de la charge
  const formatLoadWeight = () => {
    if (loadData.weight && loadData.weight.value !== undefined) {
      let value = loadData.weight.value;
      let unit = loadData.weight.unit || 'kg';
      
      // Si l'unité est en grammes, convertir en kg si nécessaire
      if (unit.toLowerCase() === 'g' && value >= 1000) {
        value = (value / 1000).toFixed(2);
        unit = 'kg';
      }
      return `${value} ${unit}`;
    }
    return 'Not specified';
  };

  // Fonction pour formater les dimensions de la charge
  const formatLoadDimensions = () => {
    if (loadData.dimensions) {
      const { length, width, height, unit } = loadData.dimensions;
      return `${length}×${width}×${height} ${unit || 'mm'}`;
    }
    if (loadData.size) {
      const dimensions = [];
      if (loadData.size.length) {
        dimensions.push(`L: ${loadData.size.length.value} ${loadData.size.length.unit || 'mm'}`);
      }
      if (loadData.size.width) {
        dimensions.push(`W: ${loadData.size.width.value} ${loadData.size.width.unit || 'mm'}`);
      }
      if (loadData.size.height) {
        dimensions.push(`H: ${loadData.size.height.value} ${loadData.size.height.unit || 'mm'}`);
      }
      return dimensions.length > 0 ? dimensions.join(', ') : 'Not specified';
    }
    return 'Not specified';
  };

  // Render d'une page avec les informations en haut et les photos en bas  
    const renderPage = (pagePhotos, pageIndex, isFirstPage = false) => {
    const { height: photoHeight, cols } = getPhotoSize(pagePhotos.length);
    
    return (
      <div 
        key={`page-${pageIndex}`}
        style={{ 
          minHeight: '297mm', // Format A4 exact
          maxHeight: '297mm',
          width: '210mm',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          padding: '10mm', // Marges réduites mais professionnelles
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          pageBreakAfter: pageIndex < totalPages - 1 ? 'always' : 'auto',
          pageBreakInside: 'avoid',
          boxSizing: 'border-box',          overflow: 'hidden'
        }}
      >
        {/* Header avec informations */}
        <SectionHeader
          title="LOAD CONFIGURATION"
          subtitle={loadData.loadType || 'Load configuration details'}
          icon={faWeightHanging}
          trialData={trialData}
          clientData={clientData}
          sectionType="load"
          showSubtitle={isFirstPage}
        />

        {/* Informations détaillées de la charge (première page uniquement) */}
        {isFirstPage && (
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
              {/* Colonne gauche - Configuration de charge */}
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
                  <FontAwesomeIcon icon={faLayerGroup} style={{ color: '#ff9800' }} />
                  Load Configuration
                </h3>
                
                <div style={{ display: 'grid', gap: '12px' }}>
                  {loadData.loadType && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <span style={{ fontWeight: '600', color: '#424242' }}>Load Type:</span>
                      <span style={{ color: '#666', maxWidth: '60%', textAlign: 'right' }}>{loadData.loadType}</span>
                    </div>
                  )}
                  {loadData.loadConfiguration && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <span style={{ fontWeight: '600', color: '#424242' }}>Configuration:</span>
                      <span style={{ color: '#666', maxWidth: '60%', textAlign: 'right' }}>{loadData.loadConfiguration}</span>
                    </div>
                  )}
                  {loadData.part_count && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <span style={{ fontWeight: '600', color: '#424242' }}>Parts Count:</span>
                      <span style={{ color: '#666', maxWidth: '60%', textAlign: 'right' }}>{loadData.part_count}</span>
                    </div>
                  )}
                  {loadData.floor_count && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <span style={{ fontWeight: '600', color: '#424242' }}>Floors Count:</span>
                      <span style={{ color: '#666', maxWidth: '60%', textAlign: 'right' }}>{loadData.floor_count}</span>
                    </div>
                  )}
                  {loadData.positioning && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                      <span style={{ fontWeight: '600', color: '#424242' }}>Positioning:</span>
                      <span style={{ color: '#666', maxWidth: '60%', textAlign: 'right' }}>{loadData.positioning}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne droite - Dimensions et poids de la charge */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '25px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '1px solid #fff3e0'
              }}>
                <h3 style={{ 
                  color: '#ff6f00', 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <FontAwesomeIcon icon={faArrowsAlt} style={{ color: '#ff8f00' }} />
                  Physical Properties
                </h3>
                
                {/* Section Poids de la charge */}
                <div style={{ 
                  background: '#fffbf0', 
                  borderRadius: '8px', 
                  padding: '15px', 
                  marginBottom: '15px',
                  border: '1px solid #ffe0b2'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <FontAwesomeIcon icon={faWeight} style={{ fontSize: '16px', color: '#ff6f00' }} />
                    <span style={{ fontWeight: '700', color: '#e65100', fontSize: '15px' }}>Total Weight</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                    {formatLoadWeight()}
                  </div>
                </div>

                {/* Section Dimensions de la charge */}
                <div style={{ 
                  background: '#fffbf0', 
                  borderRadius: '8px', 
                  padding: '15px',
                  border: '1px solid #ffe0b2'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <FontAwesomeIcon icon={faRuler} style={{ fontSize: '16px', color: '#ff6f00' }} />
                    <span style={{ fontWeight: '700', color: '#e65100', fontSize: '15px' }}>Load Dimensions</span>
                  </div>
                  
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                    {formatLoadDimensions()}
                  </div>
                </div>
              </div>
            </div>

            {/* Commentaires de la charge (si présents) */}
            {loadData.comments && (
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
                  Load Comments
                </h3>
                
                <div style={{ 
                  padding: '15px',
                  background: '#fafafa',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <p style={{ margin: 0, color: '#555', fontSize: '14px' }}>{loadData.comments}</p>
                </div>
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
              Load Photos
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
            }}>              {pagePhotos.map((photo, index) => (
                <div key={getPhotoId(photo)} style={{
                  width: '100%',
                  maxWidth: cols === 1 ? '450px' : '350px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s ease',
                  background: 'white'
                }}>
                  <img 
                    src={getPhotoUrlWithDebug(photo)}
                    alt={`Load photo ${(pageIndex * photosPerPage) + index + 1}`}
                    style={{
                      width: '100%',
                      height: photoHeight,
                      objectFit: 'contain',
                      backgroundColor: '#f8f9fa',
                      display: 'block'
                    }}                    onError={(e) => {
                      console.error(`Image loading error: ${e.target.src}`);
                      
                      const alternateUrl = `/api/files/${getPhotoId(photo)}`;
                      if (e.target.src !== alternateUrl) {
                        
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
            <strong>Load Configuration</strong> - ECM Industrial Analysis
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
  if (loadPhotos.length === 0) {
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

export default LoadSection;
