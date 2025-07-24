import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faThermometerHalf, faChartArea, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import fileService from '../../../../../../../services/fileService';
import SectionHeader from './common/SectionHeader';

const CurvesSection = ({ testData = {}, selectedPhotos = {}, clientData = {} }) => {
  // Safety check for test data
  const safeTestData = testData || {};
    // Function to get photo URL with support for both ID and metadata object
  const getPhotoUrl = (photo) => {
    // If photo is an object with metadata
    if (photo && typeof photo === 'object' && photo.id) {
      return fileService.getFilePreviewUrl(photo.id);
    }
    // If photo is just an ID
    return fileService.getFilePreviewUrl(photo);
  };
  
  // Function to get photo ID from photo object or ID
  const getPhotoId = (photo) => {
    return photo && typeof photo === 'object' ? photo.id : photo;
  };// Function to organize photos by subcategory based on metadata from SectionPhotoManager
  const getCurvesPhotosByCategory = () => {
    const result = {
      heating: [],
      cooling: [],
      datapaq: [],
      alarms: []
    };
    
    if (!selectedPhotos || !selectedPhotos.curves) {
      console.log("No curves photos selected");
      return result;
    }
    
    const curvesPhotos = selectedPhotos.curves;
    console.log("Raw selectedPhotos.curves:", curvesPhotos);
    
    // The new format from SectionPhotoManager should be objects with metadata
    if (typeof curvesPhotos === 'object' && !Array.isArray(curvesPhotos)) {
      console.log("Processing new format with metadata from SectionPhotoManager");
      
      // Direct mapping from organized data by SectionPhotoManager
      Object.entries(curvesPhotos).forEach(([subcategory, photos]) => {
        console.log(`Processing subcategory: ${subcategory}, photos:`, photos);
        
        if (Array.isArray(photos)) {
          // Photos now have metadata, extract just the photo objects for display
          const photoObjects = photos.map(photo => {
            // If it's already a metadata object, keep it
            if (photo && typeof photo === 'object' && photo.id) {
              return photo;
            }
            // If it's just an ID, create a basic object
            return { id: photo };
          });
          
          if (subcategory === 'heating') {
            result.heating = photoObjects;
          } else if (subcategory === 'cooling') {
            result.cooling = photoObjects;
          } else if (subcategory === 'datapaq') {
            result.datapaq = photoObjects;
          } else if (subcategory === 'alarms') {
            result.alarms = photoObjects;
          }
        }
      });
    }
    // Legacy fallback: if it's still a flat array or other format
    else if (Array.isArray(curvesPhotos)) {
      console.log("Processing legacy flat array format");
      
      curvesPhotos.forEach((photo, index) => {
        const photoObj = typeof photo === 'object' ? photo : { id: photo };
        // Simple distribution for fallback
        const categoryIndex = index % 4;
        const categories = ['heating', 'cooling', 'datapaq', 'alarms'];
        result[categories[categoryIndex]].push(photoObj);
      });
    }
    
    console.log("Final organized curves photos with metadata:", result);
    return result;
  };// Use the function to organize photos
  const groupedPhotos = getCurvesPhotosByCategory();
  
  // Create a flat array of all photos if needed
  const curvesPhotos = [
    ...groupedPhotos.heating,
    ...groupedPhotos.cooling,
    ...groupedPhotos.datapaq,
    ...groupedPhotos.alarms
  ];

  // Debug photo information
  console.log("CurvesSection - testData:", testData);
  console.log("CurvesSection - selectedPhotos:", selectedPhotos);
  console.log("CurvesSection - curvesPhotos (after processing):", curvesPhotos);
  
  if (curvesPhotos.length > 0) {
    console.log(`URL for first curve image:`, getPhotoUrl(curvesPhotos[0]));
  }

  // Pagination intelligente
  const paginatedContent = useMemo(() => {
    // Vérification des photos disponibles
    if (!groupedPhotos || 
        (groupedPhotos.heating.length === 0 && 
         groupedPhotos.cooling.length === 0 && 
         groupedPhotos.datapaq.length === 0 && 
         groupedPhotos.alarms.length === 0)) {
      return [{ 
        heating: [], 
        cooling: [], 
        datapaq: [], 
        alarms: [],
        nonCurvePhotos: [] 
      }];
    }

    // Estimation de hauteur par section
    const estimateHeight = (photos, isMainSection = false) => {
      if (photos.length === 0) return 0;
      
      const headerHeight = isMainSection ? 60 : 45;
      const photosPerRow = photos.length === 1 ? 1 : photos.length === 2 ? 2 : 3;
      const rows = Math.ceil(photos.length / photosPerRow);
      const photoHeight = photos.length <= 2 ? 190 : 150;
      const spacing = 15;
      const marginBottom = 20;
      
      return headerHeight + (rows * (photoHeight + spacing)) + marginBottom;
    };

    const maxPageHeight = 800;
    const headerHeight = 120; 
    const footerHeight = 60;
    const availableHeight = maxPageHeight - headerHeight - footerHeight;
    
    console.log(`CurvesSection Pagination - MaxPage: ${maxPageHeight}, Header: ${headerHeight}, Footer: ${footerHeight}, Available: ${availableHeight}`);
    
    const pages = [];
    let currentPage = { heating: [], cooling: [], datapaq: [], alarms: [], nonCurvePhotos: [] };
    let currentHeight = 0;

    // Organiser les photos par catégorie pour la pagination
    const categoriesToProcess = [
      { name: 'heating', photos: groupedPhotos.heating },
      { name: 'cooling', photos: groupedPhotos.cooling },
      { name: 'datapaq', photos: groupedPhotos.datapaq },
      { name: 'alarms', photos: groupedPhotos.alarms }
    ];

    categoriesToProcess.forEach(({ name, photos }) => {
      if (photos.length === 0) return;

      const sectionHeight = estimateHeight(photos, name === 'heating');
      console.log(`CurvesSection - ${name}: ${photos.length} photos, estimated height: ${sectionHeight}px`);
      
      if (currentHeight + sectionHeight > availableHeight && 
          (currentPage.heating.length > 0 || currentPage.cooling.length > 0 || 
           currentPage.datapaq.length > 0 || currentPage.alarms.length > 0)) {
        console.log(`CurvesSection - Creating new page. Current height: ${currentHeight}, Available: ${availableHeight}`);
        pages.push(currentPage);
        currentPage = { heating: [], cooling: [], datapaq: [], alarms: [], nonCurvePhotos: [] };
        currentHeight = 0;
      }

      currentPage[name] = photos;
      currentHeight += sectionHeight + 30; // Ajout d'espacement entre sections
      console.log(`CurvesSection - Added ${name}, new total height: ${currentHeight}px`);
    });

    if (currentPage.heating.length > 0 || currentPage.cooling.length > 0 || 
        currentPage.datapaq.length > 0 || currentPage.alarms.length > 0) {
      pages.push(currentPage);
    }

    return pages.length > 0 ? pages : [{ heating: [], cooling: [], datapaq: [], alarms: [], nonCurvePhotos: [] }];
  }, [groupedPhotos]);

  return paginatedContent.map((pageContent, pageIndex) => (
    <div key={`curves-page-${pageIndex}`} style={{ 
      minHeight: '297mm', // Format A4 exact
      maxHeight: '297mm',
      width: '210mm',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      padding: '8mm', // Marges réduites
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      pageBreakAfter: 'always',
      pageBreakInside: 'avoid',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* Header avec informations */}
      <SectionHeader
        title="TREATMENT CURVES"
        subtitle="Temperature and process curves analysis"
        icon={faChartLine}
        testData={testData}
        clientData={clientData}
        sectionType="curves"
        showSubtitle={true}
      />
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '25px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid #e3f2fd'
      }}>
        {(pageContent.heating.length > 0 || pageContent.cooling.length > 0 || 
          pageContent.datapaq.length > 0 || pageContent.alarms.length > 0) ? (
          <>
            {/* Heating curve photos */}
            {pageContent.heating.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ 
                  color: '#1976d2', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FontAwesomeIcon icon={faThermometerHalf} style={{ color: '#f44336' }} />
                  Heating Curve
                </h3>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: pageContent.heating.length === 1 
                    ? '1fr' 
                    : pageContent.heating.length === 2 
                      ? 'repeat(2, 1fr)' 
                      : 'repeat(auto-fill, minmax(380px, 1fr))',
                  gap: '15px',
                  marginBottom: '8px'
                }}>
                  {pageContent.heating.map((photo, index) => (
                    <div key={`heating-${getPhotoId(photo)}-${index}`} style={{ 
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                    }}>
                      <img 
                        src={getPhotoUrl(photo)}
                        alt={`Heating curve ${index + 1}`}
                        style={{
                          width: '100%',
                          height: pageContent.heating.length <= 2 ? '190px' : '150px',
                          objectFit: 'contain',
                          backgroundColor: '#f8f9fa'
                        }}
                        onError={(e) => {
                          console.error(`Erreur de chargement d'image: ${e.target.src}`);
                          
                          // Tentative avec une URL alternative
                          const alternateUrl = `/api/files/${getPhotoId(photo)}`;
                          
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
            {pageContent.cooling.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ 
                  color: '#1976d2', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FontAwesomeIcon icon={faChartArea} style={{ color: '#42a5f5' }} />
                  Cooling Curve
                </h3>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: pageContent.cooling.length === 1 
                    ? '1fr' 
                    : pageContent.cooling.length === 2 
                      ? 'repeat(2, 1fr)' 
                      : 'repeat(auto-fill, minmax(380px, 1fr))',
                  gap: '15px',
                  marginBottom: '8px'
                }}>
                  {pageContent.cooling.map((photo, index) => (
                    <div key={`cooling-${getPhotoId(photo)}-${index}`} style={{ 
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                    }}>
                      <img 
                        src={getPhotoUrl(photo)}
                        alt={`Cooling curve ${index + 1}`}
                        style={{
                          width: '100%',
                          height: pageContent.cooling.length <= 2 ? '190px' : '150px',
                          objectFit: 'contain',
                          backgroundColor: '#f8f9fa'
                        }}
                        onError={(e) => {
                          console.error(`Erreur de chargement d'image: ${e.target.src}`);
                          
                          // Tentative avec une URL alternative
                          const alternateUrl = `/api/files/${getPhotoId(photo)}`;
                          
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
            )}            {/* Photos Datapaq */}
            {pageContent.datapaq.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ 
                  color: '#1976d2', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FontAwesomeIcon icon={faChartLine} style={{ color: '#42a5f5' }} />
                  Datapaq Results
                </h3>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: pageContent.datapaq.length === 1 
                    ? '1fr' 
                    : pageContent.datapaq.length === 2 
                      ? 'repeat(2, 1fr)' 
                      : 'repeat(auto-fill, minmax(380px, 1fr))',
                  gap: '15px',
                  marginBottom: '8px'
                }}>
                  {pageContent.datapaq.map((photo, index) => (
                    <div key={`datapaq-${getPhotoId(photo)}-${index}`} style={{ 
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                    }}>
                      <img 
                        src={getPhotoUrl(photo)}
                        alt={`Datapaq ${index + 1}`}
                        style={{
                          width: '100%',
                          height: pageContent.datapaq.length <= 2 ? '190px' : '150px',
                          objectFit: 'contain',
                          backgroundColor: '#f8f9fa'
                        }}
                        onError={(e) => {
                          console.error(`Erreur de chargement d'image: ${e.target.src}`);
                          
                          // Tentative avec une URL alternative
                          const alternateUrl = `/api/files/${getPhotoId(photo)}`;
                          
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
            )}            {/* Photos d'alarmes */}
            {pageContent.alarms.length > 0 && (
              <div>
                <h3 style={{ 
                  color: '#1976d2', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#f57c00' }} />
                  Alarm Log
                </h3>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: pageContent.alarms.length === 1 
                    ? '1fr' 
                    : pageContent.alarms.length === 2 
                      ? 'repeat(2, 1fr)' 
                      : 'repeat(auto-fill, minmax(380px, 1fr))',
                  gap: '15px'
                }}>
                  {pageContent.alarms.map((photo, index) => (
                    <div key={`alarm-${getPhotoId(photo)}-${index}`} style={{ 
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.08)'
                    }}>
                      <img 
                        src={getPhotoUrl(photo)}
                        alt={`Alarm log ${index + 1}`}
                        style={{
                          width: '100%',
                          height: pageContent.alarms.length <= 2 ? '190px' : '150px',
                          objectFit: 'contain',
                          backgroundColor: '#f8f9fa'
                        }}
                        onError={(e) => {
                          console.error(`Erreur de chargement d'image: ${e.target.src}`);
                          
                          // Tentative avec une URL alternative
                          const alternateUrl = `/api/files/${getPhotoId(photo)}`;
                          
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
              </div>            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '15px',
        paddingTop: '8px',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '10px',
        color: '#666'
      }}>
        <div>
          <strong>Treatment Curves</strong> - ECM Industrial Analysis
          {paginatedContent.length > 1 && ` (Page ${pageIndex + 1}/${paginatedContent.length})`}
        </div>
        <div>
          {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>
    </div>
  ));
};

export default CurvesSection;
