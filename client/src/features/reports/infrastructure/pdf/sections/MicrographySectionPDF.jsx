/**
 * INFRASTRUCTURE: Section Micrographies pour PDF
 *
 * Affiche les micrographies en grille 2x2 unifiée :
 * - Control location photo en PREMIÈRE position (si existe)
 * - Suivie des micrographies dans l'ordre : x50, x500, x1000, other
 * - 4 photos maximum par page (grille 2x2)
 * - Saut de page automatique si plus de 4 photos
 * - Chaque photo dans la grille utilise la taille 'half' (235x176)
 */

import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { SPACING } from '../theme';
import {
  SectionTitle,
  PhotoContainer,
  EmptyState
} from '../primitives';
import { getPhotoUrl } from '../helpers/photoHelpers';

// Section-specific accent color
const SECTION_TYPE = 'micrography';

// Styles spécifiques : grille 2x2 unifiée (control location + micros)
const styles = StyleSheet.create({
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    justifyContent: 'flex-start',
    gap: SPACING.photo.gap,
  },
  photoContainerHalf: {
    width: '48%',
    marginBottom: 4,
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
 * Composant pour afficher toutes les micrographies d'un échantillon en grille 2x2
 * Grille unifiée : control location (si existe) + toutes les micros
 * 4 photos par page maximum, puis saut de page
 */
const SampleMicrographsPage = ({ resultIndex, sampleIndex, sampleData, resultDescription, sampleDescription, controlLocationPhotos }) => {
  // Générer le titre formaté
  const title = formatMicrographTitle(resultIndex, sampleIndex, resultDescription, sampleDescription);

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

  // Collecter TOUTES les photos dans un seul tableau
  // 1. D'abord la control location (si existe)
  // 2. Puis toutes les micros dans l'ordre des zooms
  const allPhotos = [];

  // Ajouter la control location en PREMIER (prend 1 place dans la grille)
  if (controlLocationPhotos && controlLocationPhotos.length > 0) {
    allPhotos.push({
      ...controlLocationPhotos[0],
      isControlLocation: true,
      caption: 'Control Location'
    });
  }

  // Ajouter toutes les micrographies par ordre de zoom
  availableZooms.forEach(zoom => {
    const photos = sampleData.zooms[zoom];
    photos.forEach(photo => {
      allPhotos.push({
        ...photo,
        zoomLabel: formatZoomName(zoom),
        caption: getPhotoCaption(photo)
      });
    });
  });

  // Paginer : 4 photos par page (grille 2x2)
  const photosPerPage = 4;
  const pages = [];
  for (let i = 0; i < allPhotos.length; i += photosPerPage) {
    pages.push(allPhotos.slice(i, i + photosPerPage));
  }

  return (
    <>
      {pages.map((pagePhotos, pageIndex) => (
        <View key={pageIndex} wrap={false} style={{ marginBottom: 8 }}>
          {/* Titre seulement sur la première page */}
          {pageIndex === 0 && (
            <SectionTitle sectionType={SECTION_TYPE}>
              {title}
            </SectionTitle>
          )}

          {/* Titre de continuation sur les pages suivantes */}
          {pageIndex > 0 && (
            <SectionTitle sectionType={SECTION_TYPE} continuation>
              {title} (continued)
            </SectionTitle>
          )}

          {/* Grille 2x2 */}
          <View style={styles.photoGrid}>
            {pagePhotos.map((photo, idx) => (
              <View key={idx} style={styles.photoContainerHalf}>
                <PhotoContainer
                  photo={photo}
                  size="half"
                  captionText={photo.isControlLocation
                    ? 'Control Location'
                    : `${photo.zoomLabel} - ${photo.caption}`
                  }
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </>
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
