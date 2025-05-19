import React from 'react';
import fileService from '../../../../../../../services/fileService';

const LoadSection = ({ testData, selectedPhotos = {} }) => {
  // Vérification de sécurité pour éviter les erreurs si testData est undefined
  const test = testData || {};

  // Récupérer les données de loadData depuis l'objet test
  const loadData = test.loadData || {};

  // Récupération des photos sélectionnées pour cette section
  let loadPhotos = [];
  
  if (selectedPhotos) {
    if (selectedPhotos.load) {
      // Si c'est déjà un tableau
      if (Array.isArray(selectedPhotos.load)) {
        loadPhotos = selectedPhotos.load;
      }
      // Si c'est un objet avec sous-catégories
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

  // Fonction pour obtenir l'URL d'une photo avec débogage
  const getPhotoUrl = (photoId) => {
    // Utiliser l'URL qui fonctionne
    return fileService.getFilePreviewUrl(photoId);
  };

  // Déboguer les informations sur les photos et les URLs
  console.log("LoadSection - testData:", testData);
  console.log("LoadSection - selectedPhotos:", selectedPhotos);
  console.log("LoadSection - loadPhotos (après traitement):", loadPhotos);
  
  if (loadPhotos.length > 0) {
    console.log(`URL pour la première image:`, getPhotoUrl(loadPhotos[0]));
  }

  return (
    <div className="report-section load-section" style={{ marginBottom: '30px' }}>
      <h3 style={{ 
        borderBottom: '2px solid #ffc107', 
        paddingBottom: '8px', 
        marginBottom: '20px',
        color: '#e0a800' 
      }}>
        Charge
      </h3>
      
      {/* Disposition principale améliorée */}
      <div className="load-section-content" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: '20px', 
        backgroundColor: '#fff',
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {/* Section 1: Infos charge et photo principale */}
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          flexWrap: 'wrap',
          padding: '20px'
        }}>
          {/* Table avec les données de chargement */}
          <div style={{ flex: '1', minWidth: '300px' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <tbody>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '10px', textAlign: 'left', width: '40%', borderBottom: '1px solid #dee2e6' }}>Paramètre</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Valeur</th>
                </tr>
                {loadData.loadType && (
                  <tr>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>Type de charge</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{loadData.loadType}</td>
                  </tr>
                )}
                {loadData.loadConfiguration && (
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>Configuration</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{loadData.loadConfiguration}</td>
                  </tr>
                )}
                {loadData.part_count && (
                  <tr>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>Nombre de pièces</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{loadData.part_count}</td>
                  </tr>
                )}
                {loadData.floor_count && (
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>Nombre d'étages</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{loadData.floor_count}</td>
                  </tr>
                )}
                {loadData.weight && (
                  <tr>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>Poids total</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                      {loadData.weight.unit && loadData.weight.unit.toLowerCase() === 'g' 
                        ? `${(loadData.weight.value / 1000).toFixed(2)} kg`
                        : `${loadData.weight.value} ${loadData.weight.unit}`}
                    </td>
                  </tr>
                )}
                {loadData.dimensions && (
                  <tr>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>Dimensions</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>
                      {`${loadData.dimensions.length}×${loadData.dimensions.width}×${loadData.dimensions.height} ${loadData.dimensions.unit}`}
                    </td>
                  </tr>
                )}
                {loadData.positioning && (
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>Positionnement</td>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{loadData.positioning}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Photo principale avec gestion d'erreur améliorée */}
          {loadPhotos.length > 0 ? (
            <div style={{ flex: '1', minWidth: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: '220px', 
                height: '180px', 
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}>
                <img 
                  src={getPhotoUrl(loadPhotos[0])} 
                  alt="Photo de charge"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#f8f9fa'
                  }}
                  onError={(e) => {
                    console.error(`Erreur de chargement d'image: ${e.target.src}`);
                    
                    // Tentative avec une URL alternative
                    const photoId = loadPhotos[0];
                    const alternateUrl = `/api/files/${photoId}`;
                    
                    console.log(`Tentative avec URL alternative: ${alternateUrl}`);
                    
                    // Si l'URL actuelle n'est pas l'URL alternative, essayer celle-ci
                    if (e.target.src !== alternateUrl) {
                      e.target.src = alternateUrl;
                      return;
                    }
                    
                    // Si l'alternative échoue aussi, afficher l'image par défaut
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              </div>
              <div style={{ fontSize: '13px', color: '#6c757d', textAlign: 'center', marginTop: '10px', fontStyle: 'italic' }}>
                Vue principale de la charge
              </div>
            </div>
          ) : (
            <div style={{ flex: '1', minWidth: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ 
                width: '200px', 
                height: '150px', 
                border: '1px dashed #dee2e6',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
                marginBottom: '10px'
              }}>
                <div style={{ color: '#6c757d', fontSize: '14px', textAlign: 'center' }}>
                  Image de la charge
                </div>
              </div>
              <div style={{ alignSelf: 'stretch', fontSize: '12px', color: '#6c757d', textAlign: 'center' }}>
                Aucune photo disponible
              </div>
            </div>
          )}
        </div>

        {/* Section Dimensions avec tableau détaillé */}
        {loadData.size && (
          <div style={{ 
            padding: '20px',
            borderTop: '1px solid #eee',
            backgroundColor: '#f9f9f9'
          }}>
            <h4 style={{ 
              fontSize: '16px', 
              marginBottom: '15px',
              fontWeight: '600',
              color: '#555'
            }}>
              Dimensions détaillées
            </h4>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Dimension</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Valeur</th>
                  <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Unité</th>
                </tr>
              </thead>
              <tbody>
                {loadData.size.length && (
                  <tr>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>Longueur</td>
                    <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>{loadData.size.length.value || 'Non spécifié'}</td>
                    <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>{loadData.size.length.unit || 'mm'}</td>
                  </tr>
                )}
                {loadData.size.width && (
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>Largeur</td>
                    <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>{loadData.size.width.value || 'Non spécifié'}</td>
                    <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>{loadData.size.width.unit || 'mm'}</td>
                  </tr>
                )}
                {loadData.size.height && (
                  <tr>
                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>Hauteur</td>
                    <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>{loadData.size.height.value || 'Non spécifié'}</td>
                    <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>{loadData.size.height.unit || 'mm'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Section 2: Photos supplémentaires avec présentation améliorée */}
        {loadPhotos.length > 1 && (
          <div style={{ 
            padding: '20px',
            borderTop: '1px solid #eee',
            backgroundColor: '#f9f9f9'
          }}>
            <h4 style={{ 
              fontSize: '16px', 
              marginBottom: '15px',
              fontWeight: '600',
              color: '#555'
            }}>
              Photos supplémentaires de la charge
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '15px'
            }}>
              {loadPhotos.slice(1).map((photoId, index) => (
                <div key={index} style={{ 
                  border: '1px solid #dee2e6',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                  transition: 'transform 0.2s',
                  height: '150px'
                }}>
                  <img 
                    src={getPhotoUrl(photoId)}
                    alt={`Photo de charge ${index + 2}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      backgroundColor: '#f8f9fa'
                    }}
                    onError={(e) => {
                      console.error(`Erreur de chargement d'image supplémentaire: ${e.target.src}`);
                      
                      // Tentative avec une URL alternative 
                      const alternateUrl = `/api/files/${photoId}`;
                      
                      // Si l'URL actuelle n'est pas l'URL alternative, essayer celle-ci
                      if (e.target.src !== alternateUrl) {
                        console.log(`Tentative avec URL alternative: ${alternateUrl}`);
                        e.target.src = alternateUrl;
                        return;
                      }
                      
                      // Si l'alternative échoue aussi, afficher l'image par défaut
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIG5vbiBkaXNwb25pYmxlPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadSection;
