/**
 * PRIMITIVE: État vide / message pour PDF
 * Affiché quand il n'y a pas de données
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme';

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  text: {
    ...TYPOGRAPHY.body,
    fontStyle: 'italic',
    color: COLORS.text.muted,
    textAlign: 'center',
  },
});

/**
 * Message d'état vide
 * @param {Object} props
 * @param {string} props.message - Message à afficher
 */
export const EmptyState = ({ message = 'Aucune donnée disponible' }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

export default EmptyState;
