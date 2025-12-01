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
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 4,
    color: '#1a1a1a',
    letterSpacing: 0.5,
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
  // Layout 3 photos - first full width, then 2 side by side
  photoFirstLarge: {
    width: 500,
    height: 300,
    marginBottom: 12,
  },
  photoSmallSideBySide: {
    width: 244,
    height: 340,
  },
  photoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  photoContainer: {
    marginBottom: 8,
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
    // Pour 4+ photos, on utilise le pattern: 1ère page = 3 photos (1 grand + 2 petits), puis 2 par page
    const pages = [];
    let currentIndex = 0;
    
    // Première page avec 3 photos
    if (photoCount >= 3) {
      pages.push([0, 1, 2]);
      currentIndex = 3;
    }
    
    // Pages suivantes avec 2 photos chacune
    while (currentIndex < photoCount) {
      const remaining = photoCount - currentIndex;
      if (remaining >= 2) {
        pages.push([currentIndex, currentIndex + 1]);
        currentIndex += 2;
      } else {
        pages.push([currentIndex]);
        currentIndex += 1;
      }
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
      <Text style={styles.sectionTitle}>LOAD CONFIGURATION</Text>
      
      {layout.pages.map((photoIndices, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const pagePhotos = photoIndices.map(idx => validPhotos[idx]);
        
        return (
          <View 
            key={`load-page-${pageIndex}`} 
            style={styles.section} 
            wrap={false}
          >
            {pageIndex > 0 && <Text style={styles.sectionTitle}>LOAD CONFIGURATION</Text>}
            
            {/* Layout 1: Single photo - full page */}
            {layout.type === 'single' && (
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
            {layout.type === 'double' && (
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

            {/* Layout 3: Three photos - 1 large + 2 side by side */}
            {layout.type === 'triple' && (
              <>
                {/* First photo - large */}
                <View style={styles.photoContainer}>
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
                
                {/* Second and third photos - side by side */}
                <View style={styles.photoRow}>
                  {pagePhotos.slice(1).map((photo, idx) => (
                    <View key={idx + 1} style={styles.photoContainer}>
                      <Image 
                        src={getPhotoUrl(photo)} 
                        style={[styles.photo, styles.photoSmallSideBySide]}
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

            {/* Layout Multiple: For pages after first page or 4+ photos */}
            {layout.type === 'multiple' && (
              <>
                {isFirstPage && photoIndices.length === 3 ? (
                  // First page with 3 photos
                  <>
                    <View style={styles.photoContainer}>
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
                            style={[styles.photo, styles.photoSmallSideBySide]}
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
                ) : photoIndices.length === 2 ? (
                  // Subsequent pages with 2 photos
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
                ) : (
                  // Single photo on a page
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
              </>
            )}
          </View>
        );
      })}
    </>
  );
};

export default LoadSectionPDF;