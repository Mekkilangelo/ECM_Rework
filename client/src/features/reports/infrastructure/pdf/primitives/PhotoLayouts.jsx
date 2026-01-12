/**
 * PRIMITIVE: Grilles de photos pour PDF
 * Différents layouts réutilisables pour afficher les photos
 */

import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { SPACING, PHOTO_SIZES } from '../theme';
import { PhotoContainer } from './PhotoContainer';
import { validatePhotos } from '../helpers/photoHelpers';

const styles = StyleSheet.create({
  // Grille 2 colonnes
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.photo.gap,
  },
  // Ligne de 2 photos
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.photo.gap,
    marginBottom: SPACING.photo.marginBottom,
  },
  // Colonne (photos empilées)
  column: {
    flexDirection: 'column',
  },
  // Conteneur pleine largeur centré
  centered: {
    alignItems: 'center',
    marginBottom: SPACING.photo.marginBottom,
  },
  // Élément de grille (demi-largeur)
  gridItem: {
    width: '48%',
    marginBottom: SPACING.photo.marginBottom,
  },
});

/**
 * Grille de 2 colonnes
 * @param {Object} props
 * @param {Array} props.photos - Liste de photos
 * @param {string} props.size - Taille des photos
 */
export const PhotoGrid2 = ({ photos, size = 'half' }) => {
  const validPhotos = validatePhotos(photos);
  if (validPhotos.length === 0) return null;
  
  return (
    <View style={styles.grid2}>
      {validPhotos.map((photo, idx) => (
        <View key={photo.id || idx} style={styles.gridItem}>
          <PhotoContainer photo={photo} size={size} />
        </View>
      ))}
    </View>
  );
};

/**
 * Photos en ligne (2 côte à côte)
 * @param {Object} props
 * @param {Array} props.photos - Liste de 2 photos
 * @param {string} props.size - Taille des photos
 */
export const PhotoRow = ({ photos, size = 'half' }) => {
  const validPhotos = validatePhotos(photos).slice(0, 2);
  if (validPhotos.length === 0) return null;
  
  return (
    <View style={styles.row}>
      {validPhotos.map((photo, idx) => (
        <PhotoContainer key={photo.id || idx} photo={photo} size={size} />
      ))}
    </View>
  );
};

/**
 * Photos empilées verticalement
 * @param {Object} props
 * @param {Array} props.photos - Liste de photos
 * @param {string} props.size - Taille des photos
 */
export const PhotoStack = ({ photos, size = 'stackedLarge' }) => {
  const validPhotos = validatePhotos(photos);
  if (validPhotos.length === 0) return null;
  
  return (
    <View style={styles.column}>
      {validPhotos.map((photo, idx) => (
        <PhotoContainer key={photo.id || idx} photo={photo} size={size} />
      ))}
    </View>
  );
};

/**
 * Photo unique centrée (hero)
 * @param {Object} props
 * @param {Object} props.photo - Photo à afficher
 * @param {string} props.size - Taille de la photo
 */
export const PhotoHero = ({ photo, size = 'fullWidth' }) => {
  if (!photo) return null;
  
  return (
    <View style={styles.centered}>
      <PhotoContainer photo={photo} size={size} />
    </View>
  );
};

/**
 * Layout Hero + Pair (1 grande photo + 2 petites en dessous)
 * Pattern utilisé par LoadSection
 * @param {Object} props
 * @param {Array} props.photos - Liste de 3 photos
 * @param {string} props.heroSize - Taille de la photo principale
 * @param {string} props.pairSize - Taille des photos secondaires
 */
export const PhotoHeroPair = ({ 
  photos, 
  heroSize = 'heroLoad', 
  pairSize = 'halfSecondary' 
}) => {
  const validPhotos = validatePhotos(photos);
  if (validPhotos.length === 0) return null;
  
  const heroPhoto = validPhotos[0];
  const pairPhotos = validPhotos.slice(1, 3);
  
  return (
    <View style={styles.column}>
      <PhotoHero photo={heroPhoto} size={heroSize} />
      {pairPhotos.length > 0 && (
        <PhotoRow photos={pairPhotos} size={pairSize} />
      )}
    </View>
  );
};

export default {
  PhotoGrid2,
  PhotoRow,
  PhotoStack,
  PhotoHero,
  PhotoHeroPair,
};
