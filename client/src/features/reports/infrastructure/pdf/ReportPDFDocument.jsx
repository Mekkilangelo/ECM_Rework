/**
 * INFRASTRUCTURE: Composant PDF avec React-PDF
 * Template principal du document PDF
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { IdentificationSectionPDF } from './sections/IdentificationSectionPDF';
import { RecipeSectionPDF } from './sections/RecipeSectionPDF';
import { ControlSectionPDF } from './sections/ControlSectionPDF';

// Enregistrer les polices personnalisées (optionnel)
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2',
// });

/**
 * Styles globaux du PDF
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF'
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#DC3545'
  },
  pageFooter: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC',
    fontSize: 8,
    color: '#666666'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    color: '#DC3545',
    borderBottomWidth: 1,
    borderBottomColor: '#DC3545',
    paddingBottom: 5
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5
  },
  label: {
    fontFamily: 'Helvetica-Bold',
    width: '40%',
    fontSize: 9
  },
  value: {
    width: '60%',
    fontSize: 9
  },
  image: {
    maxWidth: '100%',
    maxHeight: 400,
    objectFit: 'contain',
    marginVertical: 10
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  photoItem: {
    width: '48%',
    marginBottom: 10
  },
  photoImage: {
    width: '100%',
    maxHeight: 200,
    objectFit: 'contain'
  },
  photoCaption: {
    fontSize: 7,
    textAlign: 'center',
    marginTop: 2,
    color: '#666666'
  }
});

/**
 * En-tête de page
 */
const PageHeader = ({ clientName, trialCode, pageNumber }) => (
  <View style={styles.pageHeader} fixed>
    <Text>{clientName || 'Rapport d\'essai'}</Text>
    <Text>{trialCode || ''}</Text>
    <Text>Page {pageNumber}</Text>
  </View>
);

/**
 * Pied de page
 */
const PageFooter = ({ generatedDate }) => (
  <View style={styles.pageFooter} fixed>
    <Text>Généré le {generatedDate}</Text>
    <Text render={({ pageNumber, totalPages }) => 
      `${pageNumber} / ${totalPages}`
    } />
  </View>
);

/**
 * Page de garde
 */
export const CoverPage = ({ report, options }) => {
  return (
    <Page size="A4" style={styles.page}>
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Text style={{ 
          fontSize: 24, 
          fontFamily: 'Helvetica-Bold',
          marginBottom: 20,
          color: '#DC3545'
        }}>
          RAPPORT D'ESSAI
        </Text>
        
        <View style={{ marginTop: 40, width: '100%' }}>
          <DataRow label="Code essai" value={report.testCode} />
          <DataRow label="Date" value={report.testDate ? new Date(report.testDate).toLocaleDateString('fr-FR') : '-'} />
          <DataRow label="Client" value={report.clientName} />
          <DataRow label="Pièce" value={report.partName} />
          <DataRow label="Statut" value={report.status} />
          <DataRow label="Localisation" value={report.location} />
        </View>

        <View style={{ 
          position: 'absolute', 
          bottom: 40,
          fontSize: 8,
          color: '#666666'
        }}>
          <Text>Document confidentiel - {new Date().toLocaleDateString('fr-FR')}</Text>
        </View>
      </View>
    </Page>
  );
};

/**
 * Ligne de données (label + valeur)
 */
const DataRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value || '-'}</Text>
  </View>
);

/**
 * Section du document
 */
export const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

/**
 * Grille de photos
 */
export const PhotoGrid = ({ photos, getPhotoUrl }) => {
  if (!photos || photos.length === 0) return null;

  return (
    <View style={styles.photoGrid}>
      {photos.map((photo, index) => (
        <View key={index} style={styles.photoItem} wrap={false}>
          <Image 
            src={getPhotoUrl(photo)} 
            style={styles.photoImage}
          />
          <Text style={styles.photoCaption}>
            {photo.filename || `Photo ${index + 1}`}
          </Text>
        </View>
      ))}
    </View>
  );
};

/**
 * Table générique
 */
export const Table = ({ headers, rows }) => (
  <View style={{ marginTop: 10 }}>
    {/* En-têtes */}
    <View style={{ 
      flexDirection: 'row', 
      backgroundColor: '#F0F0F0',
      padding: 5,
      fontFamily: 'Helvetica-Bold',
      fontSize: 8
    }}>
      {headers.map((header, index) => (
        <Text key={index} style={{ flex: 1 }}>{header}</Text>
      ))}
    </View>
    
    {/* Lignes */}
    {rows.map((row, rowIndex) => (
      <View key={rowIndex} style={{ 
        flexDirection: 'row', 
        padding: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
        fontSize: 8
      }}>
        {row.map((cell, cellIndex) => (
          <Text key={cellIndex} style={{ flex: 1 }}>{cell}</Text>
        ))}
      </View>
    ))}
  </View>
);

/**
 * Document PDF principal
 */
export const ReportPDFDocument = ({ report, selectedPhotos = {}, options = {} }) => {
  // Validation du rapport
  if (!report || typeof report !== 'object') {
    console.error('Invalid report object:', report);
    return null;
  }
  
  const generatedDate = new Date().toLocaleDateString('fr-FR');
  
  // Récupérer les sections actives de manière sécurisée
  let activeSections = [];
  if (Array.isArray(report.sections)) {
    activeSections = report.sections.filter(s => s && s.isEnabled);
  }
  
  // Si aucune section active, afficher au moins la page de garde
  const hasActiveSections = activeSections.length > 0;

  return (
    <Document
      title={report.getTitle?.() || `Rapport d'essai ${report.testCode || 'Sans code'}`}
      author={report.clientName || 'ECM'}
      subject={`Rapport d'essai ${report.testCode || ''}`}
      creator="ECM Synergia"
      producer="ECM Synergia"
    >
      {/* Page de garde */}
      {options.includeCoverPage !== false && (
        <CoverPage report={report} options={options} />
      )}

      {/* Sections - Afficher même s'il n'y a pas de sections actives */}
      <Page size="A4" style={styles.page}>
        {options.includeHeader && (
          <PageHeader 
            clientName={report.clientName}
            trialCode={report.testCode}
            pageNumber={2}
          />
        )}

        {!hasActiveSections && (
          <View style={{ padding: 20, textAlign: 'center' }}>
            <Text style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>
              Aucune section sélectionnée pour ce rapport.
            </Text>
            <Text style={{ fontSize: 10, color: '#999', marginTop: 10 }}>
              Veuillez sélectionner au moins une section pour générer le rapport complet.
            </Text>
          </View>
        )}

        {/* Section Identification */}
        {activeSections.some(s => s.type === 'identification') && (
          <IdentificationSectionPDF 
            report={report}
            photos={selectedPhotos.identification || []}
          />
        )}

        {/* Section Recette */}
        {activeSections.some(s => s.type === 'recipe') && (
          <RecipeSectionPDF 
            report={report}
          />
        )}

        {/* Section Contrôle/Résultats */}
        {activeSections.some(s => s.type === 'control') && (
          <ControlSectionPDF 
            report={report}
          />
        )}

        {/* Autres sections - TODO: implémenter */}
        {activeSections.map((section) => {
          if (section.type === 'identification' || section.type === 'recipe' || section.type === 'control') return null;
          
          return (
            <Section key={section.id} title={section.label}>
              <Text style={{ fontSize: 9, fontStyle: 'italic', color: '#999' }}>
                Section {section.label} - En cours d'implémentation
              </Text>
            </Section>
          );
        })}

        {options.includeFooter && (
          <PageFooter generatedDate={generatedDate} />
        )}
      </Page>
    </Document>
  );
};

/**
 * Rendu d'une section (à étendre par type)
 */
const SectionRenderer = ({ section, report, options, pageNumber, generatedDate }) => {
  const { trialData, clientData } = report;

  return (
    <Page size="A4" style={styles.page}>
      {options.includeHeader && (
        <PageHeader 
          clientName={clientData?.name}
          trialCode={trialData?.trial_code}
          pageNumber={pageNumber}
        />
      )}

      <Section title={section.label}>
        {/* Contenu spécifique selon le type de section */}
        <SectionContent section={section} report={report} options={options} />
        
        {/* Photos si disponibles */}
        {section.hasPhotos && section.photos.length > 0 && (
          <PhotoGrid 
            photos={section.photos}
            getPhotoUrl={(photo) => photo.url || photo.getOptimizedUrl?.() || ''}
          />
        )}
      </Section>

      {options.includeFooter && (
        <PageFooter generatedDate={generatedDate} />
      )}
    </Page>
  );
};

/**
 * Contenu spécifique d'une section
 */
const SectionContent = ({ section, report, options }) => {
  const { trialData, partData, clientData } = report;

  switch (section.type) {
    case 'identification':
      return (
        <View>
          <Text style={{ fontSize: 12, marginBottom: 10, fontFamily: 'Helvetica-Bold' }}>
            Informations Client
          </Text>
          <DataRow label="Nom" value={clientData?.name} />
          <DataRow label="Pays" value={clientData?.country} />
          <DataRow label="Adresse" value={clientData?.address} />

          <Text style={{ fontSize: 12, marginTop: 15, marginBottom: 10, fontFamily: 'Helvetica-Bold' }}>
            Informations Pièce
          </Text>
          <DataRow label="Référence" value={partData?.part_number} />
          <DataRow label="Désignation" value={partData?.name} />
          <DataRow label="Numéro de plan" value={partData?.drawing_number} />
        </View>
      );

    case 'recipe':
      return (
        <View>
          <Text>Paramètres de recette...</Text>
          {/* À compléter avec les données de recette */}
        </View>
      );

    case 'control':
      return (
        <View>
          <Text>Résultats de contrôle...</Text>
          {/* À compléter avec les résultats */}
        </View>
      );

    default:
      return (
        <Text>Section {section.label}</Text>
      );
  }
};

export default ReportPDFDocument;
