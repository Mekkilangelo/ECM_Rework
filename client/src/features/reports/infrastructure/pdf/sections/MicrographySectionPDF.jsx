/**
 * INFRASTRUCTURE: Section Micrographies pour PDF
 * 
 * Affiche UNE PAGE de micrographies par échantillon avec tous les zooms organisés intelligemment.
 * Cette page vient après la page de résultats (dureté + courbes) de l'échantillon.
 * 
 * Refactorisé pour utiliser le système de thème et les primitives
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { SPACING, TYPOGRAPHY, COLORS } from '../theme';
import { 
  SectionTitle, 
  SubsectionTitle, 
  PhotoContainer,
  EmptyState 
} from '../primitives';
import { validatePhotos } from '../helpers/photoHelpers';

// Section-specific accent color
const SECTION_TYPE = 'micrography';

// Styles spécifiques à cette section
const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.section.marginBottom,
  },
  photoRow: {
    flexDirection: 'row',
    marginBottom: SPACING.photo.marginBottom,
    justifyContent: 'space-between',
    gap: SPACING.photo.gap,
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
 * Organise les photos par résultat > échantillon > zoom
 */
const organizePhotosByStructure = (photos) => {
  const organized = {};
  
  if (!Array.isArray(photos) || photos.length === 0) {
    return organized;
  }

  photos.forEach(photo => {
    const subcategory = photo.subcategory || '';
    const name = photo.name || photo.original_name || '';
    
    let resultIndex = 0;
    let sampleIndex = 0;
    let zoom = 'other';
    
    // Format attendu: "result-1-sample-1-x50" ou similaire
    const resultMatch = subcategory.match(/result-(\d+)/i) || name.match(/result[_-]?(\d+)/i);
    const sampleMatch = subcategory.match(/sample-(\d+)/i) || name.match(/sample[_-]?(\d+)/i);
    const zoomMatch = subcategory.match(/(x\d+|other)$/i) || name.match(/(x\d+)/i);
    
    if (resultMatch) resultIndex = parseInt(resultMatch[1]);
    if (sampleMatch) sampleIndex = parseInt(sampleMatch[1]);
    if (zoomMatch) zoom = zoomMatch[1].toLowerCase();
    
    const resultKey = `result_${resultIndex}`;
    const sampleKey = `sample_${sampleIndex}`;
    
    // Créer la structure si nécessaire
    if (!organized[resultKey]) {
      organized[resultKey] = {
        index: resultIndex,
        samples: {}
      };
    }
    
    if (!organized[resultKey].samples[sampleKey]) {
      organized[resultKey].samples[sampleKey] = {
        index: sampleIndex,
        zooms: {}
      };
    }
    
    if (!organized[resultKey].samples[sampleKey].zooms[zoom]) {
      organized[resultKey].samples[sampleKey].zooms[zoom] = [];
    }
    
    organized[resultKey].samples[sampleKey].zooms[zoom].push(photo);
  });
  
  return organized;
};

/**
 * Formate le nom d'un zoom
 */
const formatZoomName = (zoom) => {
  const zoomNames = {
    'x50': 'Magnification ×50',
    'x500': 'Magnification ×500',
    'x1000': 'Magnification ×1000',
    'other': 'Other magnifications'
  };
  return zoomNames[zoom] || zoom;
};

/**
 * Get photo caption
 */
const getPhotoCaption = (photo) => {
  return photo.description && photo.description.trim() !== '' 
    ? photo.description 
    : (photo.original_name || photo.name || 'Image');
};

/**
 * Composant pour afficher un groupe de zoom avec layout intelligent
 */
const ZoomGroup = ({ zoom, photos }) => {
  const photoCount = photos.length;
  
  return (
    <View style={styles.section}>
      <SubsectionTitle sectionType={SECTION_TYPE}>
        {formatZoomName(zoom)} ({photoCount} image{photoCount > 1 ? 's' : ''})
      </SubsectionTitle>
      
      {/* Layout adaptatif selon le nombre de photos */}
      {photoCount === 1 ? (
        <View style={styles.photoContainerSingle}>
          <PhotoContainer 
            photo={photos[0]} 
            size="fullWidth"
            captionText={getPhotoCaption(photos[0])}
          />
        </View>
      ) : photoCount === 2 ? (
        <View style={styles.photoRow}>
          {photos.map((photo, idx) => (
            <PhotoContainer 
              key={photo.id || idx}
              photo={photo} 
              size="half"
              captionText={getPhotoCaption(photo)}
            />
          ))}
        </View>
      ) : (
        <View style={styles.photoGrid}>
          {photos.map((photo, idx) => (
            <View key={photo.id || idx} style={styles.photoContainerHalf}>
              <PhotoContainer 
                photo={photo} 
                size="gridSmall"
                captionText={getPhotoCaption(photo)}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Composant pour afficher toutes les micrographies d'un échantillon sur UNE page
 */
const SampleMicrographsPage = ({ resultIndex, sampleIndex, sampleData }) => {
  if (!sampleData || !sampleData.zooms || Object.keys(sampleData.zooms).length === 0) {
    return (
      <View style={styles.section} wrap={false}>
        <SectionTitle sectionType={SECTION_TYPE}>
          MICROGRAPHS - Result {resultIndex} - Sample {sampleIndex}
        </SectionTitle>
        <EmptyState message="No micrograph available for this sample" />
      </View>
    );
  }

  // Ordre de priorité pour les zooms
  const zoomOrder = ['x50', 'x500', 'x1000', 'other'];
  const availableZooms = Object.keys(sampleData.zooms)
    .sort((a, b) => {
      const indexA = zoomOrder.indexOf(a);
      const indexB = zoomOrder.indexOf(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

  return (
    <View wrap={false}>
      <SectionTitle sectionType={SECTION_TYPE}>
        MICROGRAPHS - Result {resultIndex} - Sample {sampleIndex}
      </SectionTitle>
      
      {/* Afficher tous les zooms sur la même page */}
      {availableZooms.map(zoom => {
        const photos = sampleData.zooms[zoom];
        return (
          <ZoomGroup 
            key={zoom}
            zoom={zoom}
            photos={photos}
          />
        );
      })}
    </View>
  );
};

/**
 * Composant principal : Section Micrographies
 */
export const MicrographySectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  // Organiser les photos
  const organizedPhotos = organizePhotosByStructure(photos);
  
  // Compter le total de photos
  const totalPhotos = Object.values(organizedPhotos).reduce((total, result) => {
    return total + Object.values(result.samples).reduce((sampleTotal, sample) => {
      return sampleTotal + Object.values(sample.zooms).reduce((zoomTotal, photos) => {
        return zoomTotal + photos.length;
      }, 0);
    }, 0);
  }, 0);

  if (totalPhotos === 0) {
    return null;
  }

  const resultKeys = Object.keys(organizedPhotos).sort((a, b) => {
    return organizedPhotos[a].index - organizedPhotos[b].index;
  });

  return (
    <>
      {resultKeys.map(resultKey => {
        const result = organizedPhotos[resultKey];
        const sampleKeys = Object.keys(result.samples).sort((a, b) => {
          return result.samples[a].index - result.samples[b].index;
        });

        return sampleKeys.map(sampleKey => {
          const sample = result.samples[sampleKey];
          
          return (
            <SampleMicrographsPage
              key={`${resultKey}-${sampleKey}`}
              resultIndex={result.index}
              sampleIndex={sample.index}
              sampleData={sample}
            />
          );
        });
      })}
    </>
  );
};

export default MicrographySectionPDF;
