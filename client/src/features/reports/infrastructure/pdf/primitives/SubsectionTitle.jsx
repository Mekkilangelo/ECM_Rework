/**
 * PRIMITIVE: Sous-titre de section pour PDF
 * Utilisé pour les sous-sections avec style propre à chaque section
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { 
  COLORS, 
  TYPOGRAPHY, 
  SPACING, 
  getAccentColor, 
  getSubsectionBackground, 
  getSubsectionTextColor 
} from '../theme';

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.subsection.marginTop,
    marginBottom: SPACING.subsection.marginBottom,
  },
  title: {
    ...TYPOGRAPHY.subsectionTitle,
    paddingVertical: SPACING.subsection.paddingV,
    paddingHorizontal: SPACING.subsection.paddingH,
    borderLeftWidth: 3,
  },
});

/**
 * Sous-titre de section unifié
 * @param {Object} props
 * @param {string} props.children - Texte du sous-titre
 * @param {string} props.sectionType - Type de section (pour couleurs)
 */
export const SubsectionTitle = ({ children, sectionType }) => {
  const accentColor = getAccentColor(sectionType);
  const backgroundColor = getSubsectionBackground(sectionType);
  const textColor = getSubsectionTextColor(sectionType);
  
  return (
    <View style={styles.container}>
      <Text style={[
        styles.title, 
        { 
          borderLeftColor: accentColor,
          backgroundColor: backgroundColor,
          color: textColor,
        }
      ]}>
        {children}
      </Text>
    </View>
  );
};

export default SubsectionTitle;
