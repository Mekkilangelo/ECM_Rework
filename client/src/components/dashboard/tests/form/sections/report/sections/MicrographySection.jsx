import React from 'react';
import fileService from '../../../../../../../services/fileService';

const MicrographySection = ({ testData, selectedPhotos = {} }) => {  // Retrieve selected photos for this section with improved robustness
  let micrographyPhotos = [];
  
  if (selectedPhotos) {
    if (selectedPhotos.micrography) {
      // If it's already an array
      if (Array.isArray(selectedPhotos.micrography)) {
        micrographyPhotos = selectedPhotos.micrography;
      }
      // If it's an object with subcategories
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
    // Function to get photo URL
  const getPhotoUrl = (photoId) => {
    return fileService.getFilePreviewUrl(photoId);
  };
  
  // Debug photo information
  console.log("MicrographySection - testData:", testData);
  console.log("MicrographySection - selectedPhotos:", selectedPhotos);
  console.log("MicrographySection - micrographyPhotos (after processing):", micrographyPhotos);
    if (micrographyPhotos.length > 0) {
    console.log(`URL for first image:`, getPhotoUrl(micrographyPhotos[0]));
  }
  
  // The rest of the component remains unchanged...
  
  // Organize photos by magnification (for demonstration)
  const organizePhotos = (photos) => {
    if (photos.length === 0) return [];
    
    // Simple division for demonstration
    const photosPerGroup = Math.max(1, Math.ceil(photos.length / 3));
    const groups = [
      {
        id: 'G1',
        title: 'Magnification x50',
        photos: photos.slice(0, photosPerGroup)
      },
      {
        id: 'G2',
        title: 'Magnification x500', 
        photos: photos.slice(photosPerGroup, 2 * photosPerGroup)
      },
      {
        id: 'G3',
        title: 'Magnification x1000',
        photos: photos.slice(2 * photosPerGroup)
      }
    ].filter(group => group.photos.length > 0);
    
    return groups;
  };
  
  const photoGroups = organizePhotos(micrographyPhotos);
  const hasMicrography = micrographyPhotos.length > 0;

  return (
    <div className="report-section micrography-section" style={{ marginBottom: '30px' }}>
      <h3 style={{ 
        borderBottom: '2px solid #6f42c1', 
        paddingBottom: '8px', 
        marginBottom: '20px',
        color: '#6f42c1' 
      }}>
        Micrographs
      </h3>
      
      <div style={{ 
        padding: '20px', 
        border: '1px solid #dee2e6',
        borderRadius: '6px',
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        {hasMicrography ? (
          <>
            {photoGroups.map((group, groupIndex) => (
              <div key={group.id} style={{ 
                marginBottom: '25px',
                padding: '15px',
                border: '1px solid #dee2e6',
                borderRadius: '6px',
                backgroundColor: groupIndex % 2 === 0 ? '#fff' : '#f8f9fa',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <h4 style={{ 
                  fontSize: '18px', 
                  margin: '0 0 15px 0',
                  color: '#6f42c1',
                  borderBottom: '1px solid #e9ecef',
                  paddingBottom: '8px'
                }}>
                  {group.title}
                </h4>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '20px'
                }}>
                  {group.photos.map((photoId, photoIndex) => (
                    <div key={`${group.id}-photo-${photoIndex}`} style={{ 
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      backgroundColor: '#fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                    }}>
                      <div style={{ position: 'relative' }}>                        <img 
                          src={getPhotoUrl(photoId)}
                          alt={`Micrograph ${group.title} - ${photoIndex + 1}`}
                          style={{
                            width: '100%',
                            height: '180px',
                            objectFit: 'contain',
                            backgroundColor: '#f8f9fa'
                          }}
                          onError={(e) => {
                            console.error(`Image loading error: ${e.target.src}`);
                            
                            // Try with alternative URL
                            const alternateUrl = `/api/files/${photoId}`;
                            
                            // If current URL is not the alternative URL, try this one
                            if (e.target.src !== alternateUrl) {
                              console.log(`Trying alternative URL: ${alternateUrl}`);
                              e.target.src = alternateUrl;
                              return;
                            }
                            
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                          }}
                        />
                      </div>
                      <div style={{ 
                        padding: '10px', 
                        borderTop: '1px solid #dee2e6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>                        <div style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>
                          Sample {photoIndex + 1}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#fff', 
                          backgroundColor: '#6f42c1',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          {group.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div style={{ 
            padding: '30px', 
            textAlign: 'center', 
            color: '#6c757d',
            backgroundColor: '#f8f9fa',
            border: '1px dashed #dee2e6',
            borderRadius: '6px',
            marginTop: '10px'
          }}>            <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '10px' }}>
              No micrographs available
            </div>
            <div style={{ fontSize: '14px' }}>
              No metallographic analysis was performed for this test.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MicrographySection;
