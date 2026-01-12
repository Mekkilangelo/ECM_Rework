/**
 * PRIMITIVE: Conteneur de photo pour PDF
 * Wrapper avec bordure et légende optionnelle
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { COLORS, TYPOGRAPHY, SPACING, PHOTO_SIZES } from '../theme';
import { getPhotoUrl } from '../helpers/photoHelpers';

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.photo.marginBottom,
    alignItems: 'center',
  },
  containerRow: {
    marginBottom: SPACING.photo.marginBottom,
  },
  image: {
    objectFit: 'cover',
    borderWidth: 0.5,
    borderColor: COLORS.border.photo,
  },
  caption: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginTop: SPACING.photo.captionMarginTop,
    color: COLORS.text.light,
  },
});

/**
 * Conteneur de photo avec bordure et légende
 * @param {Object} props
 * @param {Object} props.photo - Objet photo avec url, name, etc.
 * @param {string} props.size - Clé de taille dans PHOTO_SIZES
 * @param {Object} props.customSize - Taille personnalisée { width, height }
 * @param {boolean} props.showCaption - Afficher la légende
 * @param {string} props.captionText - Texte de légende personnalisé
 */
export const PhotoContainer = ({ 
  photo, 
  size = 'half', 
  customSize = null,
  showCaption = true,
  captionText = null,
}) => {
  if (!photo) return null;
  
  const photoUrl = getPhotoUrl(photo);
  if (!photoUrl) return null;
  
  const dimensions = customSize || PHOTO_SIZES[size] || PHOTO_SIZES.half;
  const caption = captionText || photo.description || photo.original_name || photo.name;
  
  return (
    <View style={styles.container}>
      <Image 
        src={photoUrl}
        style={[styles.image, dimensions]}
      />
      {showCaption && caption && (
        <Text style={styles.caption}>{caption}</Text>
      )}
    </View>
  );
};

/**
 * Conteneur de photo pour layout en ligne (sans centrage)
 */
export const PhotoContainerInline = ({ 
  photo, 
  size = 'half', 
  customSize = null,
  showCaption = true,
  captionText = null,
}) => {
  if (!photo) return null;
  
  const photoUrl = getPhotoUrl(photo);
  if (!photoUrl) return null;
  
  const dimensions = customSize || PHOTO_SIZES[size] || PHOTO_SIZES.half;
  const caption = captionText || photo.description || photo.original_name || photo.name;
  
  return (
    <View style={styles.containerRow}>
      <Image 
        src={photoUrl}
        style={[styles.image, dimensions]}
      />
      {showCaption && caption && (
        <Text style={styles.caption}>{caption}</Text>
      )}
    </View>
  );
};

export default PhotoContainer;
