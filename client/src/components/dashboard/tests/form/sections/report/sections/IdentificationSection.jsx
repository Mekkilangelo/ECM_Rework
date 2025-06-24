// src/components/report-sections/IdentificationSection.jsx
import React from 'react';
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
  
  return (
    <div className="report-section identification-section" style={{ marginBottom: '30px' }}>
      <h3 style={{ 
        borderBottom: '2px solid #e74c3c', 
        color: '#c0392b', 
        paddingBottom: '8px', 
        marginBottom: '15px',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        Identification of the part
      </h3>
      
      <div className="section-content">
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <tbody>            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold', width: '30%', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>Designation:</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                {part.designation} 
                {part.clientDesignation && <span style={{ color: '#666', fontStyle: 'italic' }}> ({part.clientDesignation})</span>}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>Reference:</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{part.reference || 'Not specified'}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>Quantity:</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{part.quantity || 'Not specified'}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>Material:</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{part.steel || 'Not specified'}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>Weight:</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatWeight()}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>Dimensions:</td>
              <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatDimensions()}</td>
            </tr>
            {part.comments && (
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f9f9f9', border: '1px solid #ddd' }}>Comments:</td>
                <td style={{ padding: '8px', border: '1px solid #ddd' }}>{part.comments}</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Section des commentaires de la charge */}
        {test.loadData && test.loadData.comments && (
          <div style={{ 
            margin: '20px 0', 
            padding: '15px', 
            backgroundColor: '#f8f9fa', 
            border: '1px solid #dee2e6',
            borderRadius: '5px'
          }}>
            <h4 style={{ 
              marginBottom: '10px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#555'
            }}>
              Comments
            </h4>
            <p style={{ margin: 0, color: '#333' }}>
              {test.loadData.comments}
            </p>
          </div>
        )}
        
        {/* Section des photos */}
        {identificationPhotos.length > 0 && (
          <div className="photos-section">
            <h4 style={{ 
              marginTop: '20px', 
              marginBottom: '15px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#555'
            }}>
              Photos
            </h4>
            <div className="photos-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '15px'
            }}>
              {identificationPhotos.map((photoId, index) => (
                <div key={photoId} className="photo-container" style={{
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <img 
                    src={getPhotoUrlWithDebug(photoId)}
                    alt={`Photo ${index + 1}`} 
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'contain',
                      backgroundColor: '#f8f9fa'
                    }}
                    onError={(e) => {                      console.error(`Image loading error: ${e.target.src}`);
                      
                      // Tentative avec une URL alternative
                      const alternateUrl = `/api/files/${photoId}`;
                      
                      // Si l'URL actuelle n'est pas l'URL alternative, essayer celle-ci
                      if (e.target.src !== alternateUrl) {
                        console.log(`Attempting with alternative URL: ${alternateUrl}`);
                        e.target.src = alternateUrl;
                        return;
                      }
                      
                      // Si l'alternative échoue aussi, afficher l'image par défaut
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
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

export default IdentificationSection;
