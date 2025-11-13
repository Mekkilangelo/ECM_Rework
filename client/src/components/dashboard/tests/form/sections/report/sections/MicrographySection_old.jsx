import React from 'react';
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
      
      // Extract resultIndex and sampleIndex from category
      const match = category.match(/micrographs-result-(\d+)-sample-(\d+)/);
      const resultIndex = match ? parseInt(match[1]) : 0;
      const sampleIndex = match ? parseInt(match[2]) : 0;
      
      return {
        resultIndex,
        sampleIndex,
        magnification: photo.subcategory || photo.originalData?.subcategory || 'other',
        category
      };
    }
    return { resultIndex: 0, sampleIndex: 0, magnification: 'other', category: '' };
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
    // Debug photo information
  
  
  :", micrographyPhotos);
    
  if (micrographyPhotos.length > 0) {
    );
  }

  // Organize photos by hierarchy
  const organizedPhotos = organizePhotosByHierarchy(micrographyPhotos);
  const hasPhotos = Object.keys(organizedPhotos).length > 0;

      return (
    <div style={{ 
      minHeight: '297mm', // Format A4 exact
      maxHeight: '297mm',
      width: '210mm',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      padding: '10mm', // Marges réduites mais professionnelles
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      pageBreakAfter: 'always',
      pageBreakInside: 'avoid',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>{/* Header with information */}
      <SectionHeader
        title="MICROGRAPHIC ANALYSIS"
        subtitle="Metallographic examination and microstructural analysis"
        icon={faMicroscope}
        testData={testData}
        clientData={clientData}
        sectionType="micrography"
        showSubtitle={true}
      />
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '25px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #e9ecef'
      }}>        {hasPhotos ? (
          <div>
            {/* Loop through each result */}
            {Object.keys(organizedPhotos)
              .sort((a, b) => organizedPhotos[a].resultIndex - organizedPhotos[b].resultIndex)
              .map((resultKey) => {
                const resultData = organizedPhotos[resultKey];
                
                return (
                  <div key={resultKey} style={{ marginBottom: '40px' }}>
                    {/* Result title */}
                    <div style={{
                      marginBottom: '25px',
                      padding: '15px 20px',
                      background: 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)',
                      borderRadius: '8px',
                      color: 'white',
                      boxShadow: '0 2px 8px rgba(56, 142, 60, 0.3)'
                    }}>
                      <h2 style={{
                        margin: 0,
                        fontSize: '20px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <FontAwesomeIcon icon={faMicroscope} />
                        Result {resultData.resultIndex + 1}
                        {resultData.description && (
                          <span style={{ 
                            fontSize: '16px', 
                            fontWeight: '400',
                            opacity: 0.9
                          }}>
                            - {resultData.description}
                          </span>
                        )}
                      </h2>
                    </div>

                    {/* Loop through each sample in this result */}
                    {Object.keys(resultData.samples)
                      .sort((a, b) => resultData.samples[a].sampleIndex - resultData.samples[b].sampleIndex)
                      .map((sampleKey) => {
                        const sampleData = resultData.samples[sampleKey];
                        
                        return (
                          <div key={sampleKey} style={{ marginBottom: '30px' }}>
                            {/* Sample title */}
                            <div style={{
                              marginBottom: '20px',
                              padding: '12px 18px',
                              background: 'linear-gradient(135deg, #5e35b1 0%, #7e57c2 100%)',
                              borderRadius: '6px',
                              color: 'white',
                              boxShadow: '0 2px 6px rgba(94, 53, 177, 0.3)'
                            }}>
                              <h3 style={{
                                margin: 0,
                                fontSize: '18px',
                                fontWeight: '600'
                              }}>
                                Sample {sampleData.sampleIndex + 1}
                                {sampleData.description && (
                                  <span style={{ 
                                    fontSize: '14px', 
                                    fontWeight: '400',
                                    opacity: 0.9,
                                    marginLeft: '10px'
                                  }}>
                                    - {sampleData.description}
                                  </span>
                                )}
                              </h3>
                            </div>

                            {/* Loop through each magnification in this sample */}
                            {Object.keys(sampleData.magnifications)
                              .sort()
                              .map((magnification) => {
                                const photos = sampleData.magnifications[magnification];
                                  return (
                                  <div key={magnification} style={{ marginBottom: '25px' }}>
                                    {/* Magnification title */}
                                    <h4 style={{ 
                                      fontSize: '16px', 
                                      margin: '0 0 15px 0',
                                      color: '#1976d2',
                                      borderBottom: '2px solid #e3f2fd',
                                      paddingBottom: '8px',
                                      background: 'linear-gradient(90deg, #e3f2fd 0%, transparent 100%)',
                                      padding: '8px 15px',
                                      borderRadius: '4px'
                                    }}>
                                      {formatMagnificationName(magnification)}
                                      <span style={{ 
                                        fontSize: '14px', 
                                        color: '#666',
                                        fontWeight: 'normal',
                                        marginLeft: '10px'
                                      }}>
                                        ({photos.length} image{photos.length > 1 ? 's' : ''})
                                      </span>
                                    </h4>
                                    
                                    {/* Photo grid for this magnification */}
                                    <div style={{ 
                                      display: 'grid', 
                                      gridTemplateColumns: photos.length === 1 
                                        ? '1fr' 
                                        : photos.length === 2 
                                          ? 'repeat(2, 1fr)' 
                                          : 'repeat(auto-fit, minmax(300px, 1fr))',
                                      gap: '20px',
                                      marginBottom: '20px'
                                    }}>
                                      {photos.map((photo, photoIndex) => (
                                        <div key={`${resultKey}-${sampleKey}-${magnification}-${getPhotoId(photo)}-${photoIndex}`} 
                                             style={{ 
                                               border: '2px solid #e0e0e0',
                                               borderRadius: '12px',
                                               overflow: 'hidden',
                                               backgroundColor: '#fff',
                                               boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                               transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                             }}>
                                          <div style={{ position: 'relative' }}>                                            <img 
                                              src={getPhotoUrl(photo)}
                                              alt={`Micrograph ${formatMagnificationName(magnification)} - Result ${resultData.resultIndex + 1} - Sample ${sampleData.sampleIndex + 1} - ${photoIndex + 1}`}
                                              style={{
                                                width: '100%',
                                                height: photos.length === 1 ? '400px' : '250px',
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
                                            padding: '12px 15px', 
                                            borderTop: '1px solid #e0e0e0',
                                            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
                                          }}>
                                            <div style={{ 
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              marginBottom: '5px'
                                            }}>
                                              <div style={{ 
                                                fontSize: '14px', 
                                                color: '#333', 
                                                fontWeight: '600' 
                                              }}>
                                                Image {photoIndex + 1}
                                              </div>
                                              <div style={{ 
                                                fontSize: '12px', 
                                                color: '#fff', 
                                                backgroundColor: '#1976d2',
                                                padding: '3px 8px',
                                                borderRadius: '12px',
                                                fontWeight: '500'
                                              }}>
                                                {magnification}
                                              </div>
                                            </div>
                                            <div style={{                                              fontSize: '12px', 
                                              color: '#666',
                                              lineHeight: '1.4'
                                            }}>
                                              R{resultData.resultIndex + 1} - S{sampleData.sampleIndex + 1}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
          </div>
        ) : (
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
            </div>            <div style={{ 
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
        )}
      </div>    </div>
  );
};

export default MicrographySection;
