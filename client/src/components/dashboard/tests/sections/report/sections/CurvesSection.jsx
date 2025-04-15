import React, { useState, useEffect } from 'react';
import fileService from '../../../../../../services/fileService';

const CurvesSection = ({ testData, selectedPhotos = {} }) => {
  // Fonction plus intelligente pour organiser les photos par sous-catégorie
  const getCurvesPhotosByCategory = () => {
    const result = {
      heating: [],
      cooling: [],
      datapaq: [],
      alarms: []
    };
    
    if (!selectedPhotos || !selectedPhotos.curves) return result;
    
    const curvesPhotos = selectedPhotos.curves;
    
    // Si c'est un objet avec structure hiérarchique
    if (typeof curvesPhotos === 'object' && !Array.isArray(curvesPhotos)) {
      // Récupérer directement les photos par sous-catégorie
      Object.entries(curvesPhotos).forEach(([subcategory, photos]) => {
        if (subcategory === 'heating' && Array.isArray(photos)) {
          result.heating = photos;
        } else if (subcategory === 'cooling' && Array.isArray(photos)) {
          result.cooling = photos;
        } else if (subcategory === 'datapaq' && Array.isArray(photos)) {
          result.datapaq = photos;
        } else if (subcategory === 'alarms' && Array.isArray(photos)) {
          result.alarms = photos;
        }
      });
    }
    // Si c'est un tableau plat, diviser équitablement (comme avant)
    else if (Array.isArray(curvesPhotos)) {
      const quarterLen = Math.ceil(curvesPhotos.length / 4);
      result.heating = curvesPhotos.slice(0, quarterLen);
      result.cooling = curvesPhotos.slice(quarterLen, 2 * quarterLen);
      result.datapaq = curvesPhotos.slice(2 * quarterLen, 3 * quarterLen);
      result.alarms = curvesPhotos.slice(3 * quarterLen);
    }
    
    console.log("Organized curves photos:", result);
    return result;
  };

  // Utiliser la fonction pour organiser les photos
  const groupedPhotos = getCurvesPhotosByCategory();
  
  // Créer un tableau plat de toutes les photos si nécessaire
  const curvesPhotos = [
    ...groupedPhotos.heating,
    ...groupedPhotos.cooling,
    ...groupedPhotos.datapaq,
    ...groupedPhotos.alarms
  ];
  
  // Fonction pour obtenir l'URL d'une photo
  const getPhotoUrl = (photoId) => {
    return fileService.getFilePreviewUrl(photoId);
  };

  // Déboguer les informations sur les photos
  console.log("CurvesSection - testData:", testData);
  console.log("CurvesSection - selectedPhotos:", selectedPhotos);
  console.log("CurvesSection - curvesPhotos (après traitement):", curvesPhotos);
  
  if (curvesPhotos.length > 0) {
    console.log(`URL pour la première image des courbes:`, getPhotoUrl(curvesPhotos[0]));
  }
  
  return (
    <div className="report-section curves-section" style={{ marginBottom: '30px' }}>
      <h3 style={{ 
        borderBottom: '2px solid #17a2b8', 
        paddingBottom: '8px', 
        marginBottom: '20px',
        color: '#138496' 
      }}>
        Courbes de traitement
      </h3>
      
      <div style={{ 
        padding: '20px', 
        border: '1px solid #dee2e6', 
        borderRadius: '6px',
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {curvesPhotos.length > 0 ? (
          <>
            {/* Photos de courbes de chauffage */}
            {groupedPhotos.heating.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ 
                  fontSize: '18px', 
                  margin: '0 0 15px 0',
                  color: '#495057',
                  borderBottom: '1px solid #e9ecef',
                  paddingBottom: '8px'
                }}>
                  Courbe de chauffage
                </h4>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '20px',
                  marginBottom: '10px'
                }}>
                  {groupedPhotos.heating.map((photoId, index) => (
                    <div key={`heating-${index}`} style={{ 
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                    }}>
                      <img 
                        src={getPhotoUrl(photoId)}
                        alt={`Courbe de chauffage ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '220px',
                          objectFit: 'contain',
                          backgroundColor: '#f8f9fa'
                        }}
                        onError={(e) => {
                          console.error(`Erreur de chargement d'image: ${e.target.src}`);
                          
                          // Tentative avec une URL alternative
                          const alternateUrl = `/api/files/${photoId}`;
                          
                          // Si l'URL actuelle n'est pas l'URL alternative, essayer celle-ci
                          if (e.target.src !== alternateUrl) {
                            console.log(`Tentative avec URL alternative: ${alternateUrl}`);
                            e.target.src = alternateUrl;
                            return;
                          }
                          
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos de courbes de refroidissement */}
            {groupedPhotos.cooling.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ 
                  fontSize: '18px', 
                  margin: '0 0 15px 0',
                  color: '#495057',
                  borderBottom: '1px solid #e9ecef',
                  paddingBottom: '8px'
                }}>
                  Courbe de refroidissement
                </h4>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '20px',
                  marginBottom: '10px'
                }}>
                  {groupedPhotos.cooling.map((photoId, index) => (
                    <div key={`cooling-${index}`} style={{ 
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                    }}>
                      <img 
                        src={getPhotoUrl(photoId)}
                        alt={`Courbe de refroidissement ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '220px',
                          objectFit: 'contain',
                          backgroundColor: '#f8f9fa'
                        }}
                        onError={(e) => {
                          console.error(`Erreur de chargement d'image: ${e.target.src}`);
                          
                          // Tentative avec une URL alternative
                          const alternateUrl = `/api/files/${photoId}`;
                          
                          // Si l'URL actuelle n'est pas l'URL alternative, essayer celle-ci
                          if (e.target.src !== alternateUrl) {
                            console.log(`Tentative avec URL alternative: ${alternateUrl}`);
                            e.target.src = alternateUrl;
                            return;
                          }
                          
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos Datapaq */}
            {groupedPhotos.datapaq.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ 
                  fontSize: '18px', 
                  margin: '0 0 15px 0',
                  color: '#495057',
                  borderBottom: '1px solid #e9ecef',
                  paddingBottom: '8px'
                }}>
                  Résultats Datapaq
                </h4>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '20px',
                  marginBottom: '10px'
                }}>
                  {groupedPhotos.datapaq.map((photoId, index) => (
                    <div key={`datapaq-${index}`} style={{ 
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                    }}>
                      <img 
                        src={getPhotoUrl(photoId)}
                        alt={`Datapaq ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '220px',
                          objectFit: 'contain',
                          backgroundColor: '#f8f9fa'
                        }}
                        onError={(e) => {
                          console.error(`Erreur de chargement d'image: ${e.target.src}`);
                          
                          // Tentative avec une URL alternative
                          const alternateUrl = `/api/files/${photoId}`;
                          
                          // Si l'URL actuelle n'est pas l'URL alternative, essayer celle-ci
                          if (e.target.src !== alternateUrl) {
                            console.log(`Tentative avec URL alternative: ${alternateUrl}`);
                            e.target.src = alternateUrl;
                            return;
                          }
                          
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos d'alarmes */}
            {groupedPhotos.alarms.length > 0 && (
              <div>
                <h4 style={{ 
                  fontSize: '18px', 
                  margin: '0 0 15px 0',
                  color: '#495057',
                  borderBottom: '1px solid #e9ecef',
                  paddingBottom: '8px'
                }}>
                  Journal d'alarmes
                </h4>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '20px'
                }}>
                  {groupedPhotos.alarms.map((photoId, index) => (
                    <div key={`alarm-${index}`} style={{ 
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                    }}>
                      <img 
                        src={getPhotoUrl(photoId)}
                        alt={`Journal d'alarmes ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '220px',
                          objectFit: 'contain',
                          backgroundColor: '#f8f9fa'
                        }}
                        onError={(e) => {
                          console.error(`Erreur de chargement d'image: ${e.target.src}`);
                          
                          // Tentative avec une URL alternative
                          const alternateUrl = `/api/files/${photoId}`;
                          
                          // Si l'URL actuelle n'est pas l'URL alternative, essayer celle-ci
                          if (e.target.src !== alternateUrl) {
                            console.log(`Tentative avec URL alternative: ${alternateUrl}`);
                            e.target.src = alternateUrl;
                            return;
                          }
                          
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Zone pour graphique de température quand il n'y a pas de photos */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Courbe de température</h4>
              <div style={{ 
                height: '200px', 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <div style={{ textAlign: 'center', color: '#6c757d' }}>
                  <div>Graphique de température vs temps</div>
                  <div style={{ fontSize: '12px', marginTop: '5px' }}>
                    (Les données réelles de la courbe seront intégrées ici)
                  </div>
                </div>
              </div>
            </div>
            
            {/* Zone pour graphique de potentiel carbone */}
            {testData.processType && testData.processType.toLowerCase().includes("cémentation") && (
              <div>
                <h4 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Potentiel carbone</h4>
                <div style={{ 
                  height: '150px', 
                  backgroundColor: '#f8f9fa', 
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <div style={{ textAlign: 'center', color: '#6c757d' }}>
                    <div>Graphique de potentiel carbone vs temps</div>
                    <div style={{ fontSize: '12px', marginTop: '5px' }}>
                      (Les données réelles de la courbe seront intégrées ici)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CurvesSection;
