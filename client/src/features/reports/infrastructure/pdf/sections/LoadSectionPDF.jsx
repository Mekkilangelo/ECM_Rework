/**
 * INFRASTRUCTURE: Load Configuration Section for PDF
 * Displays load configuration photos with intelligent layout
 *
 * Layout Strategy:
 * - 1 photo: full page
 * - 2 photos: stacked vertically
 * - 3 photos: hero + pair (1 large + 2 smaller below)
 * - 4+ photos: first page = hero + pair, then grid 2x3 (6 par page)
 */

import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { SPACING, PHOTO_SIZES } from '../theme';
import { 
  SectionTitle, 
  PhotoContainer,
  PhotoHero,
  PhotoHeroPair,
  PhotoRow,
  PhotoGrid2,
  EmptyState 
} from '../primitives';
import { validatePhotos } from '../helpers/photoHelpers';

// Section-specific accent color
const SECTION_TYPE = 'load';

// Styles spécifiques à cette section
const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.section.marginBottom,
  },
  photoStack: {
    flexDirection: 'column',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.photo.gap,
  },
});

// Photo sizes specific to Load section
const LOAD_PHOTO_SIZES = {
  fullPage: { width: 500, height: 700 },
  halfPage: { width: 500, height: 340 },
  heroLarge: { width: 500, height: 280 },
  pairSmall: { width: 244, height: 200 },
  // Grille 2x3 (6 par page) pour pages suivantes
  gridItem: { width: 244, height: 155 },
};

/**
 * Calculate intelligent layout based on photo count
 * - 1 photo: full page
 * - 2 photos: stacked vertically
 * - 3 photos: hero + pair (1 large + 2 small)
 * - 4+ photos: first page = hero + pair, then grid 2x3 (6 par page)
 */
const calculateLayout = (photoCount) => {
  if (photoCount === 1) {
    return { type: 'single', pages: [[0]] };
  } else if (photoCount === 2) {
    return { type: 'double', pages: [[0, 1]] };
  } else if (photoCount === 3) {
    return { type: 'triple', pages: [[0, 1, 2]] };
  } else {
    // 4+ photos: first page = 3 (hero + pair), then grid 2x3
    const pages = [];
    let currentIndex = 0;

    // First page with special layout
    pages.push([0, 1, 2]);
    currentIndex = 3;

    // Following pages with grid (6 photos max per page)
    while (currentIndex < photoCount) {
      const remaining = photoCount - currentIndex;
      const photosThisPage = Math.min(remaining, 6);
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
 * Single Photo Layout - Full page
 */
const SinglePhotoLayout = ({ photo }) => (
  <PhotoContainer 
    photo={photo} 
    customSize={LOAD_PHOTO_SIZES.fullPage}
  />
);

/**
 * Double Photo Layout - Stacked vertically
 */
const DoublePhotoLayout = ({ photos }) => (
  <View style={styles.photoStack}>
    {photos.map((photo, idx) => (
      <PhotoContainer 
        key={photo.id || idx}
        photo={photo} 
        customSize={LOAD_PHOTO_SIZES.halfPage}
      />
    ))}
  </View>
);

/**
 * Triple Photo Layout - Hero + Pair pattern
 * 1 large photo on top, 2 smaller photos below side by side
 */
const TriplePhotoLayout = ({ photos }) => {
  const [heroPhoto, ...pairPhotos] = photos;
  
  return (
    <View style={styles.photoStack}>
      {/* Hero photo */}
      <PhotoContainer 
        photo={heroPhoto} 
        customSize={LOAD_PHOTO_SIZES.heroLarge}
      />
      
      {/* Pair row */}
      <View style={styles.photoGrid}>
        {pairPhotos.map((photo, idx) => (
          <PhotoContainer 
            key={photo.id || idx}
            photo={photo} 
            customSize={LOAD_PHOTO_SIZES.pairSmall}
          />
        ))}
      </View>
    </View>
  );
};

/**
 * Grid Photo Layout - 2x2 grid for subsequent pages
 */
const GridPhotoLayout = ({ photos }) => (
  <View style={styles.photoGrid}>
    {photos.map((photo, idx) => (
      <PhotoContainer 
        key={photo.id || idx}
        photo={photo} 
        customSize={LOAD_PHOTO_SIZES.gridItem}
      />
    ))}
  </View>
);

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
        <SectionTitle sectionType={SECTION_TYPE}>
          LOAD CONFIGURATION
        </SectionTitle>
        <EmptyState message="No load configuration photos available for this trial." />
      </View>
    );
  }

  const layout = calculateLayout(validPhotos.length);

  return (
    <>
      {layout.pages.map((photoIndices, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const pagePhotos = photoIndices.map(idx => validPhotos[idx]);
        
        // Determine layout type for this page
        let pageLayout = layout.type;
        if (layout.type === 'multiple' && !isFirstPage) {
          pageLayout = 'grid';
        }
        
        return (
          <View 
            key={`load-page-${pageIndex}`} 
            style={styles.section}
            break={pageIndex > 0}
          >
            <SectionTitle 
              sectionType={SECTION_TYPE} 
              continuation={pageIndex > 0}
            >
              LOAD CONFIGURATION
            </SectionTitle>
            
            {/* Single photo - full page */}
            {pageLayout === 'single' && (
              <SinglePhotoLayout photo={pagePhotos[0]} />
            )}

            {/* Double photos - stacked vertically */}
            {pageLayout === 'double' && (
              <DoublePhotoLayout photos={pagePhotos} />
            )}

            {/* Triple or Multiple first page - hero + pair */}
            {(pageLayout === 'triple' || (pageLayout === 'multiple' && isFirstPage)) && (
              <TriplePhotoLayout photos={pagePhotos} />
            )}

            {/* Grid layout for subsequent pages */}
            {pageLayout === 'grid' && (
              <GridPhotoLayout photos={pagePhotos} />
            )}
          </View>
        );
      })}
    </>
  );
};

export default LoadSectionPDF;
