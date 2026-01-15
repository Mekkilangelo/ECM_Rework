/**
 * INFRASTRUCTURE: Section Micrographies pour PDF
 *
 * Affiche les micrographies par échantillon avec zooms organisés intelligemment.
 * Chaque groupe de zoom (x50, x500, x1000) reste groupé (wrap={false}).
 * Si le contenu dépasse une page, les zooms s'étalent sur plusieurs pages.
 *
 * Layout par zoom:
 * - 1 photo: micrographySingle (480x165)
 * - 2 photos: half (235x176) côte à côte
 * - 3+ photos: small (235x140) en grille
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { SPACING, TYPOGRAPHY, COLORS } from '../theme';
import { 
  SectionTitle, 
  SubsectionTitle, 
  PhotoContainer,
  EmptyState 
} from '../primitives';
import { validatePhotos, getPhotoUrl } from '../helpers/photoHelpers';

// Section-specific accent color
const SECTION_TYPE = 'micrography';

// Styles spécifiques à cette section (optimisés pour 3 zooms par page)
const styles = StyleSheet.create({
  section: {
    marginBottom: 6,
  },
  photoRow: {
    flexDirection: 'row',
    marginBottom: 4,
    justifyContent: 'space-between',
    gap: SPACING.photo.gap,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    justifyContent: 'flex-start',
    gap: SPACING.photo.gap,
  },
  photoContainerSingle: {
    width: '100%',
    marginBottom: 4,
    alignItems: 'center',
  },
  photoContainerHalf: {
    width: '48%',
    marginBottom: 4,
    alignItems: 'center',
  },
  // Styles pour control location
  controlLocationContainer: {
    marginBottom: 8,
    padding: 6,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  controlLocationTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#666666',
  },
  controlPhotoWrapper: {
    width: 150,
    height: 112,
    backgroundColor: '#f5f5f5',
    border: '0.5pt solid #d0d0d0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  controlPhoto: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  controlPhotoLabel: {
    fontSize: 6.5,
    textAlign: 'center',
    marginTop: 2,
    color: '#888',
    fontStyle: 'italic',
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
 * wrap={false} pour garder chaque zoom groupé sur la même page
 */
const ZoomGroup = ({ zoom, photos }) => {
  const photoCount = photos.length;

  return (
    <View style={styles.section} wrap={false}>
      <SubsectionTitle sectionType={SECTION_TYPE}>
        {formatZoomName(zoom)} ({photoCount} image{photoCount > 1 ? 's' : ''})
      </SubsectionTitle>

      {/* Layout adaptatif selon le nombre de photos */}
      {photoCount === 1 ? (
        <View style={styles.photoContainerSingle}>
          <PhotoContainer
            photo={photos[0]}
            size="micrographySingle"
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
                size="small"
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
 * Génère le titre formaté pour une page micrographs
 */
const formatMicrographTitle = (resultIndex, sampleIndex, resultDescription, sampleDescription) => {
  // Construire le titre du résultat
  let resultPart = resultDescription 
    ? resultDescription 
    : `Result ${resultIndex}`;
  
  // Construire le titre de l'échantillon
  let samplePart = sampleDescription 
    ? sampleDescription 
    : `Sample ${sampleIndex}`;
  
  return `MICROGRAPHS - ${resultPart} - ${samplePart}`;
};

/**
 * Composant pour afficher toutes les micrographies d'un échantillon sur UNE page
 */
const SampleMicrographsPage = ({ resultIndex, sampleIndex, sampleData, resultDescription, sampleDescription, controlLocationPhotos }) => {
  // Générer le titre formaté
  const title = formatMicrographTitle(resultIndex, sampleIndex, resultDescription, sampleDescription);
  const hasControlPhotos = controlLocationPhotos && controlLocationPhotos.length > 0;
  
  if (!sampleData || !sampleData.zooms || Object.keys(sampleData.zooms).length === 0) {
    return (
      <View style={styles.section} wrap={false}>
        <SectionTitle sectionType={SECTION_TYPE}>
          {title}
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
    <View>
      <SectionTitle sectionType={SECTION_TYPE}>
        {title}
      </SectionTitle>

      {/* Photo de localisation de contrôle */}
      {hasControlPhotos && (
        <View wrap={false} style={styles.controlLocationContainer}>
          <Text style={styles.controlLocationTitle}>Control Location</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {controlLocationPhotos.slice(0, 2).map((photo, idx) => (
              <View key={idx} style={{ alignItems: 'center' }}>
                <View style={styles.controlPhotoWrapper}>
                  <Image src={getPhotoUrl(photo)} style={styles.controlPhoto} />
                </View>
                {(photo.description || photo.original_name || photo.name) && (
                  <Text style={styles.controlPhotoLabel}>
                    {photo.description || photo.original_name || photo.name}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Afficher les zooms - chaque ZoomGroup a wrap={false} pour rester groupé */}
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
export const MicrographySectionPDF = ({ report, photos = [], controlLocationPhotos = [] }) => {
  if (!report) return null;

  // Extraire les données de résultats pour les descriptions
  const resultsData = report?.resultsData || report?.trialData?.results_data;
  
  // Organiser les photos de micrographies
  const organizedPhotos = organizePhotosByStructure(photos);
  
  // Organiser les photos de control location par result-sample
  const controlPhotosByResultSample = {};
  if (Array.isArray(controlLocationPhotos)) {
    controlLocationPhotos.forEach(photo => {
      const match = photo.subcategory?.match(/result-(\d+)-sample-(\d+)/);
      if (match) {
        const resultIndex = parseInt(match[1], 10);
        const sampleIndex = parseInt(match[2], 10);
        const key = `result-${resultIndex}-sample-${sampleIndex}`;
        
        if (!controlPhotosByResultSample[key]) {
          controlPhotosByResultSample[key] = [];
        }
        controlPhotosByResultSample[key].push(photo);
      }
    });
  }
  
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

  /**
   * Récupère les descriptions pour un result/sample spécifique
   */
  const getResultSampleData = (resultIndex, sampleIndex) => {
    let resultDescription = null;
    let sampleDescription = null;
    
    if (resultsData?.results && Array.isArray(resultsData.results)) {
      const resultData = resultsData.results[resultIndex];
      if (resultData) {
        resultDescription = resultData.description;
        
        if (resultData.samples && Array.isArray(resultData.samples)) {
          const sampleData = resultData.samples[sampleIndex];
          if (sampleData) {
            sampleDescription = sampleData.description;
          }
        }
      }
    }
    
    return { resultDescription, sampleDescription };
  };

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
          const { resultDescription, sampleDescription } = getResultSampleData(result.index, sample.index);
          
          // Récupérer les photos de control location pour ce result-sample
          const photoKey = `result-${result.index}-sample-${sample.index}`;
          const sampleControlPhotos = controlPhotosByResultSample[photoKey] || [];
          
          return (
            <SampleMicrographsPage
              key={`${resultKey}-${sampleKey}`}
              resultIndex={result.index}
              sampleIndex={sample.index}
              sampleData={sample}
              resultDescription={resultDescription}
              sampleDescription={sampleDescription}
              controlLocationPhotos={sampleControlPhotos}
            />
          );
        });
      })}
    </>
  );
};

export default MicrographySectionPDF;
