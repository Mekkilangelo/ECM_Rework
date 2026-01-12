/**
 * PRIMITIVE: Tableau de données pour PDF
 * Tableau générique réutilisable avec header et lignes
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme';

const styles = StyleSheet.create({
  table: {
    width: '100%',
    marginTop: SPACING.table.marginTop,
    marginBottom: SPACING.table.marginBottom,
    borderWidth: 1,
    borderColor: COLORS.border.dark,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.background.light,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.brand.primary,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  rowAlt: {
    backgroundColor: COLORS.background.subtle,
  },
  headerCell: {
    ...TYPOGRAPHY.tableHeader,
    paddingHorizontal: SPACING.table.cellPaddingH,
    paddingVertical: SPACING.table.cellPaddingV,
    borderRightWidth: 1,
    borderRightColor: COLORS.border.dark,
  },
  cell: {
    ...TYPOGRAPHY.tableCell,
    paddingHorizontal: SPACING.table.cellPaddingH,
    paddingVertical: SPACING.table.cellPaddingV,
    borderRightWidth: 1,
    borderRightColor: COLORS.border.light,
  },
  lastCell: {
    borderRightWidth: 0,
  },
});

/**
 * Tableau de données générique
 * @param {Object} props
 * @param {Array<string>} props.headers - En-têtes de colonnes
 * @param {Array<Array<string>>} props.rows - Lignes de données
 * @param {Array<number|string>} props.columnWidths - Largeurs des colonnes (optionnel)
 * @param {boolean} props.striped - Lignes alternées
 */
export const DataTable = ({ 
  headers = [], 
  rows = [], 
  columnWidths = null,
  striped = false 
}) => {
  if (headers.length === 0 && rows.length === 0) return null;
  
  // Calculer les largeurs par défaut si non spécifiées
  const defaultWidth = `${100 / headers.length}%`;
  const getColumnWidth = (index) => {
    if (!columnWidths) return { width: defaultWidth };
    const width = columnWidths[index];
    if (typeof width === 'number') return { width: `${width}%` };
    return { width: width || defaultWidth };
  };
  
  return (
    <View style={styles.table}>
      {/* En-têtes */}
      {headers.length > 0 && (
        <View style={styles.headerRow}>
          {headers.map((header, index) => (
            <Text 
              key={`header-${index}`} 
              style={[
                styles.headerCell, 
                getColumnWidth(index),
                index === headers.length - 1 && styles.lastCell
              ]}
            >
              {header}
            </Text>
          ))}
        </View>
      )}
      
      {/* Lignes de données */}
      {rows.map((row, rowIndex) => (
        <View 
          key={`row-${rowIndex}`} 
          style={[
            styles.row, 
            striped && rowIndex % 2 === 1 && styles.rowAlt
          ]}
        >
          {row.map((cell, cellIndex) => (
            <Text 
              key={`cell-${rowIndex}-${cellIndex}`} 
              style={[
                styles.cell, 
                getColumnWidth(cellIndex),
                cellIndex === row.length - 1 && styles.lastCell
              ]}
            >
              {cell ?? '-'}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
};

export default DataTable;
