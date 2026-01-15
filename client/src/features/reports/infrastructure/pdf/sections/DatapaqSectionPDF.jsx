/**
 * INFRASTRUCTURE: Section Datapaq pour le PDF
 * Affiche les rapports et graphiques Datapaq
 * 
 * Utilise le système de thème et les primitives pour cohérence visuelle
 */

import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { SPACING } from '../theme';
import { 
  SectionTitle, 
  PhotoContainer,
  EmptyState 
} from '../primitives';
import { validatePhotos } from '../helpers/photoHelpers';

// Section-specific accent color
const SECTION_TYPE = 'datapaq';

// Styles spécifiques à cette section
const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.section.marginBottom,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
    justifyContent: 'flex-start',
    gap: SPACING.photo.gap,
  },
  photoContainerSingle: {
    width: '100%',
    marginBottom: SPACING.photo.marginBottom,
    alignItems: 'center',
  },
  photoContainerHalf: {
    width: '48%',
    marginBottom: SPACING.photo.marginBottom,
    alignItems: 'center',
  },
});

/**
 * Calcule le layout approprié selon le nombre de photos
 */
const calculateLayout = (photoCount) => {
  if (photoCount === 1) {
    return { type: 'single', pages: [[0]] };
  }
  
  if (photoCount === 2) {
    return { type: 'double', pages: [[0, 1]] };
  }
  
  // Pour 3+ photos: première page avec 1 grande photo, pages suivantes avec 2 photos
  const pages = [];
  const photos = Array.from({ length: photoCount }, (_, i) => i);
  
  // Première page: 1 photo
  pages.push([photos[0]]);
  
  // Pages suivantes: 2 photos par page
  let remainingPhotos = photos.slice(1);
  while (remainingPhotos.length > 0) {
    pages.push(remainingPhotos.slice(0, 2));
    remainingPhotos = remainingPhotos.slice(2);
  }
  
  return { type: 'multiple', pages };
};

/**
 * Layout pour une seule photo (pleine page)
 */
const SinglePhotoLayout = ({ photo }) => (
  <PhotoContainer 
    photo={photo} 
    customSize={{ 
      width: '100%', 
      maxHeight: 500 
    }}
  />
);

/**
 * Layout pour deux photos (côte à côte)
 */
const DoublePhotoLayout = ({ photos }) => (
  <View style={styles.photoGrid}>
    {photos.map((photo, idx) => (
      <PhotoContainer 
        key={photo.id || idx}
        photo={photo} 
        customSize={{ 
          width: '48%', 
          maxHeight: 350 
        }}
      />
    ))}
  </View>
);

/**
 * Datapaq Section for PDF
 */
export const DatapaqSectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  // Validate and process photos
  const validPhotos = validatePhotos(photos || []);
  
  if (validPhotos.length === 0) {
    return (
      <View style={styles.section}>
        <SectionTitle sectionType={SECTION_TYPE}>
          DATAPAQ REPORTS
        </SectionTitle>
        <EmptyState message="No Datapaq reports or graphs available for this trial." />
      </View>
    );
  }

  const layout = calculateLayout(validPhotos.length);

  return (
    <>
      {layout.pages.map((photoIndices, pageIndex) => {
        const pagePhotos = photoIndices.map(idx => validPhotos[idx]);
        
        return (
          <View 
            key={`datapaq-page-${pageIndex}`} 
            style={styles.section}
            break={pageIndex > 0}
          >
            <SectionTitle 
              sectionType={SECTION_TYPE} 
              continuation={pageIndex > 0}
            >
              DATAPAQ REPORTS
            </SectionTitle>
            
            {/* Single photo - full page */}
            {layout.type === 'single' && (
              <SinglePhotoLayout photo={pagePhotos[0]} />
            )}

            {/* Double photos or multiple pages */}
            {(layout.type === 'double' || layout.type === 'multiple') && (
              <DoublePhotoLayout photos={pagePhotos} />
            )}
          </View>
        );
      })}
    </>
  );
};

export default DatapaqSectionPDF;
