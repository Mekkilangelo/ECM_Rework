/**
 * INFRASTRUCTURE: En-tête commune pour toutes les sections du rapport PDF
 * Style optimisé avec theme sombre et design premium
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';

/**
 * Styles pour l'en-tête commune - Design "Premium" Sombre
 */
const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#1e293b', // Dark Slate Blue / Midnight
    padding: 15, // Reduced from 20 to widen content
    marginBottom: 20,
    flexDirection: 'column',
  },

  // Haut: Titre et Logos
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },

  titleContainer: {
    flexDirection: 'column',
  },

  mainTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 5,
    letterSpacing: 1,
  },

  subTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#ef4444', // Rouge type "Quality Control"
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  logoContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 15, // Gap not fully supported in all react-pdf versions, use margin
    borderRadius: 2, // Légèrement arrondi si supporté, sinon ignoré
  },

  logoECM: {
    width: 120, // Plus gros comme demandé
    height: 45, // Ratio approximatif
    objectFit: 'contain',
  },

  logoSynergy: {
    width: 120,
    height: 45,
    objectFit: 'contain',
    marginLeft: 15, // Substitute for gap
    display: 'none', // Caché pour le moment si on veut juste ECM en gros, ou à garder si besoin
  },

  // Bas: Info Client et Essai
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%', // Ensure full width usage
  },

  clientBox: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#ef4444', // Rouge accent
    flexGrow: 1, // Allow to stretch
    marginRight: 20, // Space between boxes
  },

  clientName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    textAlign: 'left', // Left align standard
  },

  infoBox: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'column',
    alignItems: 'flex-end',
    minWidth: 180, // Allow it to be smaller if needed, but flex will handle
  },

  infoRowPrimary: {
    flexDirection: 'row',
    // gap: 15, // Remove gap
    alignItems: 'baseline',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4,
    marginBottom: 4,
    width: '100%',
    justifyContent: 'flex-end',
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 15, // Substitute for gap
  },

  infoLabel: {
    fontFamily: 'Helvetica',
    color: '#64748b',
    marginRight: 5,
    fontSize: 12,
  },

  infoValue: {
    color: '#1e293b',
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
  },

  treatmentItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
});

/**
 * Composant d'en-tête commune pour le rapport PDF
 */
export const CommonReportHeader = ({
  clientName = '',
  loadNumber = '',
  trialDate = '',
  processType = '',
  logoECMUrl = '/images/logoECM.png',
  logoSynergyUrl = '/images/logoECM.png',
}) => {
  // Formater la date
  const formattedDate = trialDate
    ? new Date(trialDate).toISOString().split('T')[0] // YYYY-MM-DD
    : '-';

  // URLs complètes
  const baseURL = 'http://localhost:5001';
  const fullLogoECMUrl = logoECMUrl.startsWith('http') ? logoECMUrl : `${baseURL}${logoECMUrl}`;
  // const fullLogoSynergyUrl = logoSynergyUrl.startsWith('http') ? logoSynergyUrl : `${baseURL}${logoSynergyUrl}`;

  return (
    <View style={styles.headerContainer} fixed>
      {/* Ligne du haut: Titre et Logo */}
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Trial Report</Text>
          <Text style={styles.subTitle}>Quality Control & Heat Treatment</Text>
        </View>

        <View style={styles.logoContainer}>
          <Image src={fullLogoECMUrl} style={styles.logoECM} />
        </View>
      </View>

      {/* Ligne du bas: Client et Infos */}
      <View style={styles.bottomRow}>
        {/* Boite Client */}
        <View style={styles.clientBox}>
          <Text style={styles.clientName}>{clientName || 'CLIENT'}</Text>
        </View>

        {/* Boite Infos */}
        <View style={styles.infoBox}>
          <View style={styles.infoRowPrimary}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Load</Text>
              <Text style={styles.infoValue}>{loadNumber || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
          </View>

          <View style={styles.treatmentItem}>
            <Text style={styles.infoLabel}>Treatment</Text>
            <Text style={styles.infoValue}>{processType || '-'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default CommonReportHeader;
