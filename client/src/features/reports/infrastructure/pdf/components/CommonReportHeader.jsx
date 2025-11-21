/**
 * INFRASTRUCTURE: En-tête commune pour toutes les sections du rapport PDF
 * Style optimisé avec logos et informations clés
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';

/**
 * Styles pour l'en-tête commune
 */
const styles = StyleSheet.create({
  headerContainer: {
    borderBottom: '2px solid #DC3545',
    paddingBottom: 10,
    marginBottom: 20,
  },
  
  // Section des logos
  logosSection: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 5,
  },
  
  logoECM: {
    width: 80,
    height: 'auto',
    objectFit: 'contain',
  },
  
  logoSynergy: {
    width: 60,
    height: 'auto',
    objectFit: 'contain',
  },
  
  // Section des informations
  infoSection: {
    paddingRight: 100, // Espace pour les logos
  },
  
  // Titre principal
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#DC3545',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  // Nom du client
  clientName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
    marginBottom: 6,
  },
  
  // Ligne d'informations (Load N° et Date)
  infoRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 4,
    fontSize: 14,
    fontFamily: 'Helvetica',
  },
  
  infoItem: {
    flexDirection: 'row',
  },
  
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#555555',
    marginRight: 4,
  },
  
  infoValue: {
    color: '#333333',
  },
  
  // Traitement
  treatment: {
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#555555',
  },
  
  treatmentLabel: {
    fontFamily: 'Helvetica-Bold',
    marginRight: 4,
  },
});

/**
 * Composant d'en-tête commune pour le rapport PDF
 * @param {Object} props
 * @param {string} props.clientName - Nom du client
 * @param {string} props.loadNumber - Numéro de charge
 * @param {string} props.trialDate - Date de l'essai
 * @param {string} props.processType - Type de traitement
 * @param {string} props.logoECMUrl - URL du logo ECM
 * @param {string} props.logoSynergyUrl - URL du logo Synergy (temporairement le logo ECM)
 */
export const CommonReportHeader = ({ 
  clientName = '',
  loadNumber = '',
  trialDate = '',
  processType = '',
  logoECMUrl = '/images/logoECM.png',
  logoSynergyUrl = '/images/logoECM.png', // Logo ECM en doublon temporairement
}) => {
  // Formater la date si elle est fournie
  const formattedDate = trialDate 
    ? new Date(trialDate).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '-';

  // Construire les URLs complètes pour les logos (sans /api/)
  // Force le chemin complet pour éviter tout problème de cache ou de variable d'env
  const baseURL = 'http://localhost:5001';
  const fullLogoECMUrl = logoECMUrl.startsWith('http') ? logoECMUrl : `${baseURL}${logoECMUrl}`;
  const fullLogoSynergyUrl = logoSynergyUrl.startsWith('http') ? logoSynergyUrl : `${baseURL}${logoSynergyUrl}`;

  console.log('🔍 CommonReportHeader - Données reçues:', { 
    clientName, 
    loadNumber, 
    trialDate, 
    processType,
    logoECMUrl,
    logoSynergyUrl,
    baseURL,
    fullLogoECMUrl, 
    fullLogoSynergyUrl 
  });

  return (
    <View style={styles.headerContainer} fixed>
      {/* Section des logos (coin supérieur droit) */}
      <View style={styles.logosSection}>
        <Image 
          src={fullLogoECMUrl} 
          style={styles.logoECM}
        />
        <Image 
          src={fullLogoSynergyUrl} 
          style={styles.logoSynergy}
        />
      </View>
      
      {/* Section des informations */}
      <View style={styles.infoSection}>
        {/* Titre H1 */}
        <Text style={styles.title}>Trial Report</Text>
        
        {/* Nom du client (directement, pas de label) */}
        {clientName && (
          <Text style={styles.clientName}>{clientName}</Text>
        )}
        
        {/* Ligne d'informations H2 : Load N° et Date */}
        <View style={styles.infoRow}>
          {loadNumber && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Load N°:</Text>
              <Text style={styles.infoValue}>{loadNumber}</Text>
            </View>
          )}
          
          {trialDate && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
          )}
        </View>
        
        {/* Traitement H3 */}
        {processType && (
          <View style={{ flexDirection: 'row' }}>
            <Text style={[styles.treatment, styles.treatmentLabel]}>Traitement:</Text>
            <Text style={styles.treatment}>{processType}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CommonReportHeader;
