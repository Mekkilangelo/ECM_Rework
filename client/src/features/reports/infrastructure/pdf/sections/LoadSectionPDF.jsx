/**
 * INFRASTRUCTURE: Load Configuration Section for PDF
 * Displays load configuration photos with intelligent layout
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { getPhotoUrl, validatePhotos } from '../helpers/photoHelpers';

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#ffffff',
    backgroundColor: '#2c3e50',
    letterSpacing: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#16a085',
  },
  // Layout 1 photo - full width, full page height
  photoFullPage: {
    width: 500,
    height: 700,
  },
  // Layout 2 photos - stacked vertically, full width each
  photoHalfPage: {
    width: 500,
    height: 340,
    marginBottom: 12,
  },
  // Layout 3 photos - first full width centered, then 2 side by side below
  photoFirstLarge: {
    width: 500,
    height: 280,
    marginBottom: 8,
  },
  photoBottomRow: {
    width: 244,
    height: 200,
  },
  photoContainerCentered: {
    marginBottom: 8,
    alignItems: 'center',
  },
  // Layout grille 2x3 (6 photos par page)
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  photoGridItem: {
    width: 244,
    height: 240,
  },
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  photoContainer: {
    marginBottom: 12,
  },
  photo: {
    objectFit: 'cover',
    border: '0.5pt solid #d0d0d0',
  },
  photoLabel: {
    fontSize: 7.5,
    textAlign: 'center',
    marginTop: 3,
    color: '#888',
    fontStyle: 'italic',
  },
  emptyState: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#999',
    marginTop: 8,
  },
});

/**
 * Calculate intelligent layout based on photo count
 */
const calculateLayout = (photoCount) => {
  if (photoCount === 1) {
    return { type: 'single', pages: [[0]] };
  } else if (photoCount === 2) {
    return { type: 'double', pages: [[0, 1]] };
  } else if (photoCount === 3) {
    return { type: 'triple', pages: [[0, 1, 2]] };
  } else {
    // Pour 4+ photos: 1ère page = 3 photos (1 grand + 2 petits), puis grille 2x2 (4 photos par page max)
    const pages = [];
    let currentIndex = 0;
    
    // Première page avec 3 photos (layout spécial)
    pages.push([0, 1, 2]);
    currentIndex = 3;
    
    // Pages suivantes avec grille 2x2 (4 photos par page max pour éviter débordement)
    while (currentIndex < photoCount) {
      const remaining = photoCount - currentIndex;
      const photosThisPage = Math.min(remaining, 4);
      const pageIndices = [];
      for (let i = 0; i < photosThisPage; i++) {
        pageIndices.push(currentIndex + i);
      }
      pages.push(pageIndices);
      currentIndex += photosThisPage;
    }
    
    return { type: 'multiple', pages };
  }
};

/**
 * Load Configuration Section for PDF
 */
export const LoadSectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  // Validate and process photos
  const validPhotos = validatePhotos(photos || []);
  
  if (validPhotos.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>LOAD CONFIGURATION</Text>
        <Text style={styles.emptyState}>
          No load configuration photos available for this trial.
        </Text>
      </View>
    );
  }

  const layout = calculateLayout(validPhotos.length);

  return (
    <>
      {layout.pages.map((photoIndices, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const pagePhotos = photoIndices.map(idx => validPhotos[idx]);
        
        // Déterminer le type de layout pour cette page
        let pageLayout = layout.type;
        if (layout.type === 'multiple' && !isFirstPage) {
          pageLayout = 'grid'; // Pages suivantes utilisent toujours la grille
        }
        
        return (
          <View 
            key={`load-page-${pageIndex}`} 
            style={styles.section}
            break={pageIndex > 0}
          >
            <Text style={styles.sectionTitle}>
              {pageIndex === 0 ? 'LOAD CONFIGURATION' : 'LOAD CONFIGURATION (suite)'}
            </Text>
            
            {/* Layout 1: Single photo - full page */}
            {pageLayout === 'single' && (
              <View style={styles.photoContainer}>
                <Image 
                  src={getPhotoUrl(pagePhotos[0])} 
                  style={[styles.photo, styles.photoFullPage]}
                />
                {(pagePhotos[0].original_name || pagePhotos[0].name) && (
                  <Text style={styles.photoLabel}>
                    {pagePhotos[0].original_name || pagePhotos[0].name}
                  </Text>
                )}
              </View>
            )}

            {/* Layout 2: Two photos - stacked vertically */}
            {pageLayout === 'double' && (
              <>
                {pagePhotos.map((photo, idx) => (
                  <View key={idx} style={styles.photoContainer}>
                    <Image 
                      src={getPhotoUrl(photo)} 
                      style={[styles.photo, styles.photoHalfPage]}
                    />
                    {(photo.original_name || photo.name) && (
                      <Text style={styles.photoLabel}>
                        {photo.original_name || photo.name}
                      </Text>
                    )}
                  </View>
                ))}
              </>
            )}

            {/* Layout 3 ou Multiple première page: 1 large + 2 en dessous */}
            {(pageLayout === 'triple' || (pageLayout === 'multiple' && isFirstPage)) && (
              <>
                <View style={styles.photoContainerCentered}>
                  <Image 
                    src={getPhotoUrl(pagePhotos[0])} 
                    style={[styles.photo, styles.photoFirstLarge]}
                  />
                  {(pagePhotos[0].original_name || pagePhotos[0].name) && (
                    <Text style={styles.photoLabel}>
                      {pagePhotos[0].original_name || pagePhotos[0].name}
                    </Text>
                  )}
                </View>
                
                <View style={styles.photoRow}>
                  {pagePhotos.slice(1).map((photo, idx) => (
                    <View key={idx + 1} style={styles.photoContainer}>
                      <Image 
                        src={getPhotoUrl(photo)} 
                        style={[styles.photo, styles.photoBottomRow]}
                      />
                      {(photo.original_name || photo.name) && (
                        <Text style={styles.photoLabel}>
                          {photo.original_name || photo.name}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Grille 2x3 pour les pages suivantes */}
            {pageLayout === 'grid' && (
              <View style={styles.photoGrid}>
                {pagePhotos.map((photo, idx) => (
                  <View key={idx} style={styles.photoContainer}>
                    <Image 
                      src={getPhotoUrl(photo)} 
                      style={[styles.photo, styles.photoGridItem]}
                    />
                    {(photo.original_name || photo.name) && (
                      <Text style={styles.photoLabel}>
                        {photo.original_name || photo.name}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </>
  );
};

export default LoadSectionPDF;