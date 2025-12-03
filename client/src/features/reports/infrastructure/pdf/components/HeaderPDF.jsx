/**
 * INFRASTRUCTURE: Header générique pour les pages PDF
 * Simplifié pour les pages internes avec titre et sous-titre
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  headerContainer: {
    borderBottom: '2px solid #DC3545',
    paddingBottom: 8,
    marginBottom: 15,
  },
  
  // Section des logos
  logosSection: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  logoECM: {
    width: 60,
    height: 'auto',
    objectFit: 'contain',
  },
  
  // Section des informations
  infoSection: {
    paddingRight: 140, // Espace pour les logos
  },
  
  // Titre principal
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#DC3545',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Sous-titre
  subtitle: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#555555',
    marginBottom: 3,
  },
  
  // Ligne d'informations
  infoRow: {
    flexDirection: 'row',
    gap: 15,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  
  infoItem: {
    flexDirection: 'row',
  },
  
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#666666',
    marginRight: 3,
  },
  
  infoValue: {
    color: '#333333',
  },
});

/**
 * Composant d'en-tête générique pour pages PDF
 * @param {Object} props
 * @param {Object} props.report - Données du rapport
 * @param {string} props.title - Titre de la section
 * @param {string} props.subtitle - Sous-titre optionnel
 * @param {boolean} props.showLogos - Afficher les logos (par défaut: true)
 */
export const HeaderPDF = ({ 
  report,
  title = '',
  subtitle = '',
  showLogos = true
}) => {
  // Formater la date si elle est fournie
  const formattedDate = report?.trialData?.trial_date
    ? new Date(report.trialData.trial_date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '-';

  // URLs des logos
  const baseURL = 'http://localhost:5001';
  const logoECMUrl = `${baseURL}/images/logoECM.png`;

  return (
    <View style={styles.headerContainer} fixed>
      {/* Section des logos (coin supérieur droit) */}
      {showLogos && (
        <View style={styles.logosSection}>
          <Image 
            src={logoECMUrl} 
            style={styles.logoECM}
          />
        </View>
      )}
      
      {/* Section des informations */}
      <View style={styles.infoSection}>
        {/* Titre */}
        <Text style={styles.title}>{title}</Text>
        
        {/* Sous-titre */}
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
        
        {/* Ligne d'informations : Client, Load N° et Date */}
        <View style={styles.infoRow}>
          {report?.clientName && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Client:</Text>
              <Text style={styles.infoValue}>{report.clientName}</Text>
            </View>
          )}
          
          {report?.trialData?.load_number && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Load N°:</Text>
              <Text style={styles.infoValue}>{report.trialData.load_number}</Text>
            </View>
          )}
          
          {report?.trialData?.trial_date && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default HeaderPDF;
