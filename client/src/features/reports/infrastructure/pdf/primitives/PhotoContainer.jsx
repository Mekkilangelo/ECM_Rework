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
  // Wrapper pour le letterboxing (bandes sur les côtés si l'image ne remplit pas)
  imageWrapper: {
    backgroundColor: '#f5f5f5',
    borderWidth: 0.5,
    borderColor: COLORS.border.photo,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    objectFit: 'contain', // Affiche toute l'image sans rogner
  },
  // Mode cover pour les cas où on préfère remplir (optionnel)
  imageCover: {
    objectFit: 'cover',
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
 * @param {string} props.fit - Mode d'ajustement: 'contain' (défaut, affiche tout) ou 'cover' (remplit, peut rogner)
 */
export const PhotoContainer = ({
  photo,
  size = 'half',
  customSize = null,
  showCaption = true,
  captionText = null,
  fit = 'contain',
}) => {
  if (!photo) return null;

  const photoUrl = getPhotoUrl(photo);
  if (!photoUrl) return null;

  const dimensions = customSize || PHOTO_SIZES[size] || PHOTO_SIZES.half;
  const caption = captionText || photo.description || photo.original_name || photo.name;
  const imageStyle = fit === 'cover' ? styles.imageCover : styles.image;

  return (
    <View style={styles.container}>
      <View style={[styles.imageWrapper, dimensions]}>
        <Image
          src={photoUrl}
          style={[imageStyle, { width: '100%', height: '100%' }]}
        />
      </View>
      {showCaption && caption && (
        <Text style={styles.caption}>{caption}</Text>
      )}
    </View>
  );
};

/**
 * Conteneur de photo pour layout en ligne (sans centrage)
 * @param {string} props.fit - Mode d'ajustement: 'contain' (défaut) ou 'cover'
 */
export const PhotoContainerInline = ({
  photo,
  size = 'half',
  customSize = null,
  showCaption = true,
  captionText = null,
  fit = 'contain',
}) => {
  if (!photo) return null;

  const photoUrl = getPhotoUrl(photo);
  if (!photoUrl) return null;

  const dimensions = customSize || PHOTO_SIZES[size] || PHOTO_SIZES.half;
  const caption = captionText || photo.description || photo.original_name || photo.name;
  const imageStyle = fit === 'cover' ? styles.imageCover : styles.image;

  return (
    <View style={styles.containerRow}>
      <View style={[styles.imageWrapper, dimensions]}>
        <Image
          src={photoUrl}
          style={[imageStyle, { width: '100%', height: '100%' }]}
        />
      </View>
      {showCaption && caption && (
        <Text style={styles.caption}>{caption}</Text>
      )}
    </View>
  );
};

export default PhotoContainer;
