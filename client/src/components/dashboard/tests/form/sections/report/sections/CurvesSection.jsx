import React, { useState, useEffect } from 'react';
import fileService from '../../../../../../../services/fileService';

const CurvesSection = ({ testData = {}, selectedPhotos = {} }) => {
  // Safety check for test data
  const safeTestData = testData || {};
  
  // Smarter function to organize photos by subcategory
  const getCurvesPhotosByCategory = () => {
    const result = {
      heating: [],
      cooling: [],
      datapaq: [],
      alarms: []
    };
    
    if (!selectedPhotos || !selectedPhotos.curves) return result;
    
    const curvesPhotos = selectedPhotos.curves;
      // If it's an object with hierarchical structure
    if (typeof curvesPhotos === 'object' && !Array.isArray(curvesPhotos)) {
      // Retrieve photos directly by subcategory
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
    // If it's a flat array, divide equally (as before)
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
  // Use the function to organize photos
  const groupedPhotos = getCurvesPhotosByCategory();
  
  // Create a flat array of all photos if needed
  const curvesPhotos = [
    ...groupedPhotos.heating,
    ...groupedPhotos.cooling,
    ...groupedPhotos.datapaq,
    ...groupedPhotos.alarms
  ];
  
  // Function to get photo URL
  const getPhotoUrl = (photoId) => {
    return fileService.getFilePreviewUrl(photoId);
  };

  // Debug photo information
  console.log("CurvesSection - testData:", testData);
  console.log("CurvesSection - selectedPhotos:", selectedPhotos);
  console.log("CurvesSection - curvesPhotos (after processing):", curvesPhotos);
  
  if (curvesPhotos.length > 0) {
    console.log(`URL for first curve image:`, getPhotoUrl(curvesPhotos[0]));
  }
  
  return (
    <div className="report-section curves-section" style={{ marginBottom: '30px' }}>
      <h3 style={{ 
        borderBottom: '2px solid #17a2b8', 
        paddingBottom: '8px', 
        marginBottom: '20px',
        color: '#138496' 
      }}>
        Treatment Curves
      </h3>
      
      <div style={{ 
        padding: '20px', 
        border: '1px solid #dee2e6', 
        borderRadius: '6px',
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>        {curvesPhotos.length > 0 ? (
          <>
            {/* Heating curve photos */}
            {groupedPhotos.heating.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ 
                  fontSize: '18px', 
                  margin: '0 0 15px 0',
                  color: '#495057',
                  borderBottom: '1px solid #e9ecef',
                  paddingBottom: '8px'
                }}>
                  Heating Curve
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
                        alt={`Heating curve ${index + 1}`}
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
            )}            {/* Cooling curve photos */}
            {groupedPhotos.cooling.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ 
                  fontSize: '18px', 
                  margin: '0 0 15px 0',
                  color: '#495057',
                  borderBottom: '1px solid #e9ecef',
                  paddingBottom: '8px'
                }}>
                  Cooling Curve
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
                        alt={`Cooling curve ${index + 1}`}
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
                  Datapaq Results
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
                  Alarm Log
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
                        alt={`Alarm log ${index + 1}`}
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
          <>            {/* Temperature chart area when there are no photos */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Temperature Curve</h4>
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
                  <div>Temperature vs time chart</div>
                  <div style={{ fontSize: '12px', marginTop: '5px' }}>
                    (Actual curve data will be integrated here)
                  </div>
                </div>
              </div>
            </div>
              {/* Carbon potential chart area */}
            {safeTestData.processType && safeTestData.processType.toLowerCase().includes("cémentation") && (
              <div>                <h4 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Carbon Potential</h4>
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
                    <div>Carbon potential vs time chart</div>
                    <div style={{ fontSize: '12px', marginTop: '5px' }}>
                      (Actual curve data will be integrated here)
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
