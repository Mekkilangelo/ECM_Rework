/**
 * INFRASTRUCTURE: Section Contrôle du rapport PDF (VERSION TEST)
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    color: '#DC3545'
  },
  noData: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#999999'
  }
});

export const ControlSectionPDF = ({ report }) => {
  const hasData = report?.resultsData?.results?.length > 0;
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>6. Contrôle</Text>
      <Text style={styles.noData}>
        {hasData ? `${report.resultsData.results.length} résultat(s)` : 'Aucune donnée'}
      </Text>
    </View>
  );
};
