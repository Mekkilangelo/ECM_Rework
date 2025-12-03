/**
 * INFRASTRUCTURE: En-tête commune pour toutes les sections du rapport PDF
 * Style optimisé avec logos et informations clés
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';

/**
 * Styles pour l'en-tête commune - Design moderne et épuré
 */
const styles = StyleSheet.create({
  headerContainer: {
    borderBottom: '1.5px solid #2c3e50',
    paddingBottom: 10,
    marginBottom: 20,
    position: 'relative',
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
    opacity: 0.95,
  },
  
  logoSynergy: {
    width: 60,
    height: 'auto',
    objectFit: 'contain',
    opacity: 0.95,
  },
  
  // Section des informations
  infoSection: {
    paddingRight: 100,
  },
  
  // Titre principal
  title: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  
  // Nom du client
  clientName: {
    fontSize: 16,
    fontFamily: 'Helvetica',
    color: '#2c3e50',
    marginBottom: 6,
    paddingLeft: 2,
  },
  
  // Ligne d'informations (Load N° et Date)
  infoRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 4,
    fontSize: 14,
    fontFamily: 'Helvetica',
    paddingLeft: 2,
  },
  
  infoItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  
  infoLabel: {
    fontFamily: 'Helvetica',
    color: '#666666',
    marginRight: 4,
    fontSize: 11,
  },
  
  infoValue: {
    color: '#1a1a1a',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
  },
  
  // Traitement
  treatment: {
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#666666',
    paddingLeft: 2,
  },
  
  treatmentLabel: {
    fontFamily: 'Helvetica',
    marginRight: 4,
    fontSize: 11,
  },
  
  treatmentValue: {
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    fontSize: 12,
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
      {/* Section des logos (coin superieur droit) */}
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
        {/* Titre principal */}
        <Text style={styles.title}>Trial Report</Text>
        
        {/* Nom du client */}
        {clientName && (
          <Text style={styles.clientName}>{clientName}</Text>
        )}
        
        {/* Ligne d'informations : Load N° et Date */}
        <View style={styles.infoRow}>
          {loadNumber && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Load</Text>
              <Text style={styles.infoValue}> {loadNumber}</Text>
            </View>
          )}
          
          {trialDate && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}> {formattedDate}</Text>
            </View>
          )}
        </View>
        
        {/* Traitement */}
        {processType && (
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.treatmentLabel}>Treatment</Text>
            <Text style={styles.treatmentValue}> {processType}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CommonReportHeader;
