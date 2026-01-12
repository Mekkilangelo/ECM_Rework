/**
 * PRIMITIVE: Ligne de données (label: valeur) pour PDF
 * Utilisé pour afficher les informations en format clé-valeur
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: SPACING.dataRow.marginBottom,
    alignItems: 'flex-start',
    paddingBottom: SPACING.dataRow.paddingBottom,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border.light,
  },
  rowNoBorder: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    alignItems: 'flex-start',
  },
  label: {
    ...TYPOGRAPHY.label,
    width: '30%',
    color: COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  labelWide: {
    width: '40%',
  },
  value: {
    ...TYPOGRAPHY.value,
    width: '70%',
    color: COLORS.text.primary,
  },
  valueNarrow: {
    width: '60%',
  },
});

/**
 * Ligne de données label: valeur
 * @param {Object} props
 * @param {string} props.label - Libellé
 * @param {string} props.value - Valeur
 * @param {boolean} props.noBorder - Sans bordure inférieure
 * @param {boolean} props.wideLabel - Label plus large (40%)
 */
export const DataRow = ({ label, value, noBorder = false, wideLabel = false }) => {
  return (
    <View style={noBorder ? styles.rowNoBorder : styles.row}>
      <Text style={[styles.label, wideLabel && styles.labelWide]}>
        {label}:
      </Text>
      <Text style={[styles.value, wideLabel && styles.valueNarrow]}>
        {value || '-'}
      </Text>
    </View>
  );
};

export default DataRow;
