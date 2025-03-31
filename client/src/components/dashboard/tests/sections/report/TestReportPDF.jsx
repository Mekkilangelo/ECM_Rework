import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '1 solid #aaaaaa',
    paddingBottom: 10,
  },
  logo: {
    width: 100,
    height: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    padding: 5,
    backgroundColor: '#f0f0f0',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    textDecoration: 'underline',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 150,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: 'gray',
    borderTop: '1 solid #aaaaaa',
    paddingTop: 5,
  },
});

// Composant pour une ligne d'information
const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value !== undefined && value !== null ? value : 'Non spécifié'}</Text>
  </View>
);

// Le composant principal du rapport
const TestReportPDF = ({ reportData }) => {
  const { test, part, client } = reportData;
  
  // Extraire les valeurs pertinentes des JSON
  const partCount = test?.loadData?.part_count || 'Non spécifié';
  const weight = test?.loadData?.weight?.value || 'Non spécifié';
  const weightUnit = test?.loadData?.weight?.unit || '';
  
  // Formatter les spécifications
  const formatSpecification = (spec) => {
    if (!spec) return 'Non spécifié';
    
    if (spec.min && spec.max) {
      return `${spec.min} - ${spec.max} ${spec.unit || ''}`;
    }
    
    return spec.min || spec.max || 'Non spécifié';
  };

  // Formatter ECD
  const formatECD = (ecd) => {
    if (!ecd) return 'Non spécifié';
    return `${ecd.hardness} ${ecd.unit} (${ecd.depthMin}-${ecd.depthMax})`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Entête avec logo */}
        <View style={styles.header}>
          <Image 
            style={styles.logo} 
            // Utilisez un logo placé dans le dossier public
            src="/logo.png" 
          />
          <Text>Rapport d'Essai #{test?.testCode}</Text>
        </View>
        
        <Text style={styles.title}>RAPPORT D'ESSAI</Text>
        
        {/* Informations générales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations générales</Text>
          <InfoRow label="Test ID" value={test?.testCode} />
          <InfoRow label="Date" value={test?.testDate} />
          <InfoRow label="Statut" value={test?.status} />
          <InfoRow label="Location" value={test?.location} />
          <InfoRow label="Process" value={test?.processType} />
        </View>
        
        {/* Section Fiche d'Identification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fiche d'Identification</Text>
          
          {/* Sous-section Identification */}
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.subsectionTitle}>Identification</Text>
            <InfoRow label="Désignation" value={part?.designation} />
            <InfoRow label="Référence" value={part?.reference} />
            <InfoRow label="Nombre" value={partCount} />
            <InfoRow label="Matière" value={part?.steel} />
            <InfoRow label="Poids" value={`${weight} ${weightUnit}`} />
          </View>
          
          {/* Sous-section Client */}
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.subsectionTitle}>Client</Text>
            <InfoRow label="Nom" value={client?.name} />
            <InfoRow label="Code Client" value={client?.code} />
            <InfoRow label="Ville" value={client?.city} />
            <InfoRow label="Pays" value={client?.country} />
            <InfoRow label="Adresse" value={client?.address} />
          </View>
          
          {/* Sous-section Spécifications */}
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.subsectionTitle}>Spécifications</Text>
            <InfoRow 
              label="Dureté surface" 
              value={formatSpecification(part?.specifications?.surfaceHardness)} 
            />
            <InfoRow 
              label="Dureté cœur" 
              value={formatSpecification(part?.specifications?.coreHardness)} 
            />
            <InfoRow 
              label="ECD" 
              value={formatECD(part?.specifications?.ecd)} 
            />
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text>Document généré le {new Date().toLocaleDateString('fr-FR')}</Text>
          <Text>© {new Date().getFullYear()} Votre Entreprise - Tous droits réservés</Text>
        </View>
      </Page>
    </Document>
  );
};

export default TestReportPDF;
