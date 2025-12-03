/**
 * INFRASTRUCTURE: Section Micrographies pour PDF
 * 
 * Affiche UNE PAGE de micrographies par échantillon avec tous les zooms organisés intelligemment.
 * Cette page vient après la page de résultats (dureté + courbes) de l'échantillon.
 * 
 * Organisation intelligente inspirée de IdentificationSection :
 * - Header en haut
 * - Tous les zooms sur la même page avec layout adaptatif
 * - 1 photo seule : pleine largeur
 * - 2 photos : côte à côte
 * - 3-4 photos : grille 2x2
 * - Format portrait A4
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { getPhotoUrl } from '../helpers/photoHelpers';

const styles = StyleSheet.create({
  // ========== LAYOUT ==========
  section: {
    marginBottom: 12,
  },
  
  // ========== TITRES ==========
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 4,
    color: '#1a1a1a',
    letterSpacing: 0.5,
  },
  zoomTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#7b1fa2',
    letterSpacing: 0.3,
  },
  
  // ========== PHOTOS - Layouts adaptatifs ==========
  photoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'space-between',
    gap: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    justifyContent: 'flex-start',
    gap: 8,
  },
  
  // Conteneurs photo selon layout
  photoContainerSingle: {
    width: '100%',
    marginBottom: 8,
    alignItems: 'center',
  },
  photoContainerHalf: {
    width: '48%',
    marginBottom: 8,
    alignItems: 'center',
  },
  
  // Tailles de photos
  photo: {
    objectFit: 'cover',
    border: '0.5pt solid #d0d0d0',
  },
  photoFullWidth: {
    width: 480,
    height: 200,
  },
  photoHalfWidth: {
    width: 235,
    height: 176,
  },
  photoSmall: {
    width: 235,
    height: 140,
  },
  
  // Légendes
  photoLabel: {
    fontSize: 7.5,
    textAlign: 'center',
    marginTop: 3,
    color: '#888',
    fontStyle: 'italic',
  },
  
  // ========== ÉTATS VIDES ==========
  emptyState: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
});

/**
 * Organise les photos par résultat > échantillon > zoom
 * @param {Array} photos - Liste de toutes les photos de micrographies
 * @returns {Object} Structure organisée
 */
const organizePhotosByStructure = (photos) => {
  const organized = {};
  
  if (!Array.isArray(photos) || photos.length === 0) {
    return organized;
  }

  photos.forEach(photo => {
    // Parser les métadonnées depuis subcategory ou name
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
    'x50': 'Grossissement ×50',
    'x500': 'Grossissement ×500',
    'x1000': 'Grossissement ×1000',
    'other': 'Autres grossissements'
  };
  return zoomNames[zoom] || zoom;
};

/**
 * Composant pour afficher un groupe de zoom avec layout intelligent
 */
const ZoomGroup = ({ zoom, photos }) => {
  const photoCount = photos.length;
  
  return (
    <View style={styles.section}>
      <Text style={styles.zoomTitle}>
        {formatZoomName(zoom)} ({photoCount} image{photoCount > 1 ? 's' : ''})
      </Text>
      
      {/* Layout adaptatif selon le nombre de photos */}
      {photoCount === 1 ? (
        // 1 photo : pleine largeur
        <View style={styles.photoContainerSingle}>
          <Image 
            src={getPhotoUrl(photos[0])} 
            style={[styles.photo, styles.photoFullWidth]}
          />
          <Text style={styles.photoLabel}>
            {photos[0].description && photos[0].description.trim() !== '' 
              ? photos[0].description 
              : (photos[0].original_name || photos[0].name || 'Image')}
          </Text>
        </View>
      ) : photoCount === 2 ? (
        // 2 photos : côte à côte
        <View style={styles.photoRow}>
          {photos.map((photo, idx) => (
            <View key={photo.id || idx} style={styles.photoContainerHalf}>
              <Image 
                src={getPhotoUrl(photo)} 
                style={[styles.photo, styles.photoHalfWidth]}
              />
              <Text style={styles.photoLabel}>
                {photo.description && photo.description.trim() !== '' 
                  ? photo.description 
                  : (photo.original_name || photo.name || 'Image')}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        // 3+ photos : grille 2 colonnes
        <View style={styles.photoGrid}>
          {photos.map((photo, idx) => (
            <View key={photo.id || idx} style={styles.photoContainerHalf}>
              <Image 
                src={getPhotoUrl(photo)} 
                style={[styles.photo, styles.photoSmall]}
              />
              <Text style={styles.photoLabel}>
                {photo.description && photo.description.trim() !== '' 
                  ? photo.description 
                  : (photo.original_name || photo.name || 'Image')}
              </Text>
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
        <Text style={styles.sectionTitle}>
          MICROGRAPHIES - Résultat {resultIndex} - Échantillon {sampleIndex}
        </Text>
        <Text style={styles.emptyState}>
          Aucune micrographie disponible pour cet échantillon
        </Text>
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
      <Text style={styles.sectionTitle}>
        MICROGRAPHIES - Résultat {resultIndex} - Échantillon {sampleIndex}
      </Text>
      
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
 * Retourne UNE View par échantillon contenant tous les zooms
 * À intégrer dans le flux du document après chaque page de résultats
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
    return null; // Pas de section si pas de photos
  }

  // Générer une View par échantillon (pas de Page, juste des Views)
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
