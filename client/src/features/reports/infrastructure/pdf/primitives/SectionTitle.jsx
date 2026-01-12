/**
 * PRIMITIVE: Titre de section pour PDF
 * Utilisé par toutes les sections avec leur couleur d'accent propre
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { COLORS, TYPOGRAPHY, SPACING, getAccentColor } from '../theme';

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.section.titleMarginBottom,
  },
  title: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.text.white,
    backgroundColor: COLORS.brand.secondary,
    paddingVertical: SPACING.section.titlePaddingV,
    paddingHorizontal: SPACING.section.titlePaddingH,
    borderLeftWidth: 4,
  },
});

/**
 * Titre de section unifié
 * @param {Object} props
 * @param {string} props.children - Texte du titre
 * @param {string} props.sectionType - Type de section (pour couleur d'accent)
 * @param {boolean} props.continuation - Afficher "(suite)" si true
 */
export const SectionTitle = ({ children, sectionType, continuation = false }) => {
  const accentColor = getAccentColor(sectionType);
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { borderLeftColor: accentColor }]}>
        {children}{continuation ? ' (suite)' : ''}
      </Text>
    </View>
  );
};

export default SectionTitle;
