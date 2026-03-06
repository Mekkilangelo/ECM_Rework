/**
 * INFRASTRUCTURE: Load Configuration Section for PDF
 * Displays load photos and weight information.
 * Layout delegated to PhotoPagesLayoutPDF.
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { validatePhotos } from '../helpers/photoHelpers';
import { PhotoPagesLayoutPDF } from './PhotoPagesLayoutPDF';

const TEXT_GRAY = '#64748b';

const styles = StyleSheet.create({
  loadInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginLeft: 10,
    flexShrink: 0,
  },
  loadLabel: {
    color: '#cbd5e1',
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  loadValue: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
});

export const LoadSectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  const trialData = report.trialData || {};

  // Parse load data
  let loadDataRaw = report.loadData || report.trialData?.load_data || {};
  let loadData = loadDataRaw;
  if (typeof loadDataRaw === 'string') {
    try { loadData = JSON.parse(loadDataRaw); } catch (e) { loadData = {}; }
  }

  // Extract weight value
  let loadWeight = null;
  if (loadData.weight && typeof loadData.weight === 'object') {
    loadWeight = loadData.weight.value;
  } else {
    loadWeight = loadData.weight || trialData.load_weight_value || trialData.load_weight;
  }

  // Extract weight unit
  let loadWeightUnit = 'kg';
  if (loadData.weight?.unit) {
    loadWeightUnit = loadData.weight.unit;
  } else if (loadData.weightUnit) {
    loadWeightUnit = typeof loadData.weightUnit === 'object' ? loadData.weightUnit.name : loadData.weightUnit;
  } else if (trialData.weightUnit) {
    loadWeightUnit = typeof trialData.weightUnit === 'object' ? trialData.weightUnit.name : trialData.weightUnit;
  } else if (trialData.load_weight_unit) {
    loadWeightUnit = trialData.load_weight_unit;
  }

  const headerExtra = loadWeight ? (
    <View style={styles.loadInfo}>
      <Text style={styles.loadLabel}>WEIGHT:</Text>
      <Text style={styles.loadValue}>{loadWeight} {loadWeightUnit}</Text>
    </View>
  ) : null;

  const emptyContent = (
    <Text style={{ color: TEXT_GRAY, fontSize: 10 }}>No photos available.</Text>
  );

  return (
    <PhotoPagesLayoutPDF
      title="LOAD CONFIGURATION"
      photos={validatePhotos(photos || [])}
      headerExtra={headerExtra}
      emptyContent={emptyContent}
    />
  );
};

export default LoadSectionPDF;
