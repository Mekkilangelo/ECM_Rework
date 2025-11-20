/**
 * INFRASTRUCTURE: Composant PDF avec React-PDF
 * Template principal du document PDF
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { 
  IdentificationSectionPDF,
  MicrographySectionPDF,
  CurvesSectionPDF,
  LoadSectionPDF,
  RecipeSectionPDF,
  ControlSectionPDF 
} from './sections';

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
 * Helper pour normaliser les photos organisées vers un format simple
 */
const normalizePhotosForSection = (photos, sectionType) => {
  if (!photos) return [];
  
  // Si c'est déjà un tableau, le retourner tel quel
  if (Array.isArray(photos)) {
    return photos;
  }
  
  // Si c'est un objet organisé, l'aplatir en tableau
  if (typeof photos === 'object') {
    const flatPhotos = [];
    
    Object.keys(photos).forEach(categoryKey => {
      const categoryPhotos = photos[categoryKey];
      
      if (Array.isArray(categoryPhotos)) {
        // Ajouter les métadonnées de catégorie si elles n'existent pas
        categoryPhotos.forEach(photo => {
          flatPhotos.push({
            ...photo,
            category: photo.category || categoryKey,
            subcategory: photo.subcategory || categoryKey,
            // Construire l'URL si elle n'existe pas
            url: photo.url || photo.viewPath || (photo.id ? `http://localhost:5001/api/files/${photo.id}/preview` : ''),
            original_name: photo.name || photo.original_name,
          });
        });
      }
    });
    
    return flatPhotos;
  }
  

  return [];
};

/**
 * Document PDF principal
 */
export const ReportPDFDocument = ({ report, selectedPhotos = {}, options = {} }) => {
  // Validation stricte des paramètres
  if (!report || typeof report !== 'object') {
    console.error('❌ ReportPDFDocument: Invalid report object:', report);
    return (
      <Document title="Erreur">
        <Page size="A4" style={styles.page}>
          <Text style={{ fontSize: 16, color: 'red', textAlign: 'center', marginTop: 100 }}>
            Erreur: Rapport invalide
          </Text>
        </Page>
      </Document>
    );
  }
  
  if (process.env.NODE_ENV === 'development') {

  }
  
  const generatedDate = new Date().toLocaleDateString('fr-FR');
  
  // Récupérer les sections actives de manière sécurisée
  let activeSections = [];
  try {
    if (Array.isArray(report.sections)) {
      activeSections = report.sections.filter(s => s && s.isEnabled);
    } else if (report.getActiveSections && typeof report.getActiveSections === 'function') {
      activeSections = report.getActiveSections();
    }
  } catch (error) {
    console.error('❌ Error getting active sections:', error);
    activeSections = [];
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

      {/* Page d'information si aucune section */}
      {!hasActiveSections && (
        <Page size="A4" style={styles.page}>
          {options.includeHeader && (
            <PageHeader 
              clientName={report.clientName}
              trialCode={report.testCode}
              pageNumber={2}
            />
          )}
          <View style={{ padding: 20, textAlign: 'center', marginTop: 100 }}>
            <Text style={{ fontSize: 16, color: '#999', fontFamily: 'Helvetica-Bold', marginBottom: 20 }}>
              Aucune section sélectionnée
            </Text>
            <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
              Veuillez sélectionner au moins une section dans la configuration
            </Text>
            <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
              pour générer le rapport complet avec les photos.
            </Text>
          </View>
          {options.includeFooter && (
            <PageFooter generatedDate={generatedDate} />
          )}
        </Page>
      )}

      {/* Section Identification - Page séparée */}
      {activeSections.some(s => s.type === 'identification') && report && (
        <Page size="A4" style={styles.page}>
          {options.includeHeader && (
            <PageHeader 
              clientName={report.clientName}
              trialCode={report.testCode}
              pageNumber={"Identification"}
            />
          )}
          {(() => {
            try {

              const normalizedPhotos = normalizePhotosForSection(selectedPhotos?.identification, 'identification');
              return (
                <IdentificationSectionPDF 
                  report={report}
                  photos={normalizedPhotos}
                />
              );
            } catch (error) {
              console.error('❌ Error rendering IdentificationSectionPDF:', error);
              return (
                <Section title="IDENTIFICATION">
                  <Text style={{ fontSize: 12, color: 'red', textAlign: 'center', marginTop: 50 }}>
                    Erreur lors du rendu de la section d'identification
                  </Text>
                  <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 10 }}>
                    {error.message}
                  </Text>
                </Section>
              );
            }
          })()}
          {options.includeFooter && (
            <PageFooter generatedDate={generatedDate} />
          )}
        </Page>
      )}

      {/* Section Micrographie - Page séparée */}
      {activeSections.some(s => s.type === 'micrography') && report && (
        <Page size="A4" style={styles.page}>
          {options.includeHeader && (
            <PageHeader 
              clientName={report.clientName}
              trialCode={report.testCode}
              pageNumber={"Micrographie"}
            />
          )}
          {(() => {
            try {

              const normalizedPhotos = normalizePhotosForSection(selectedPhotos?.micrography, 'micrography');
              return (
                <MicrographySectionPDF 
                  report={report}
                  photos={normalizedPhotos}
                />
              );
            } catch (error) {
              console.error('❌ Error rendering MicrographySectionPDF:', error);
              return (
                <Section title="ANALYSE MICROGRAPHIQUE">
                  <Text style={{ fontSize: 12, color: 'red', textAlign: 'center', marginTop: 50 }}>
                    Erreur lors du rendu de la section micrographie
                  </Text>
                  <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 10 }}>
                    {error.message}
                  </Text>
                </Section>
              );
            }
          })()}
          {options.includeFooter && (
            <PageFooter generatedDate={generatedDate} />
          )}
        </Page>
      )}

      {/* Section Courbes - Page séparée */}
      {activeSections.some(s => s.type === 'curves') && report && (
        <Page size="A4" style={styles.page}>
          {options.includeHeader && (
            <PageHeader 
              clientName={report.clientName}
              trialCode={report.testCode}
              pageNumber={"Courbes"}
            />
          )}
          {(() => {
            try {

              const normalizedPhotos = normalizePhotosForSection(selectedPhotos?.curves, 'curves');
              return (
                <CurvesSectionPDF 
                  report={report}
                  photos={normalizedPhotos}
                />
              );
            } catch (error) {
              console.error('❌ Error rendering CurvesSectionPDF:', error);
              return (
                <Section title="COURBES ET RAPPORTS DE FOUR">
                  <Text style={{ fontSize: 12, color: 'red', textAlign: 'center', marginTop: 50 }}>
                    Erreur lors du rendu de la section courbes
                  </Text>
                  <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 10 }}>
                    {error.message}
                  </Text>
                </Section>
              );
            }
          })()}
          {options.includeFooter && (
            <PageFooter generatedDate={generatedDate} />
          )}
        </Page>
      )}

      {/* Section Charge - Page séparée */}
      {activeSections.some(s => s.type === 'load') && report && (
        <Page size="A4" style={styles.page}>
          {options.includeHeader && (
            <PageHeader 
              clientName={report.clientName}
              trialCode={report.testCode}
              pageNumber={"Charge"}
            />
          )}
          {(() => {
            try {

              const normalizedPhotos = normalizePhotosForSection(selectedPhotos?.load, 'load');
              return (
                <LoadSectionPDF 
                  report={report}
                  photos={normalizedPhotos}
                />
              );
            } catch (error) {
              console.error('❌ Error rendering LoadSectionPDF:', error);
              return (
                <Section title="CONFIGURATION DE CHARGE">
                  <Text style={{ fontSize: 12, color: 'red', textAlign: 'center', marginTop: 50 }}>
                    Erreur lors du rendu de la section charge
                  </Text>
                  <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 10 }}>
                    {error.message}
                  </Text>
                </Section>
              );
            }
          })()}
          {options.includeFooter && (
            <PageFooter generatedDate={generatedDate} />
          )}
        </Page>
      )}

      {/* Section Recette - Page séparée */}
      {activeSections.some(s => s.type === 'recipe') && report && (
        <Page size="A4" style={styles.page}>
          {options.includeHeader && (
            <PageHeader 
              clientName={report.clientName}
              trialCode={report.testCode}
              pageNumber={"Recette"}
            />
          )}
          {(() => {
            try {
              return <RecipeSectionPDF report={report} />;
            } catch (error) {
              console.error('❌ Error rendering RecipeSectionPDF:', error);
              return (
                <Section title="RECETTE">
                  <Text style={{ fontSize: 12, color: 'red', textAlign: 'center', marginTop: 50 }}>
                    Erreur lors du rendu de la section recette
                  </Text>
                  <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 10 }}>
                    {error.message}
                  </Text>
                </Section>
              );
            }
          })()}
          {options.includeFooter && (
            <PageFooter generatedDate={generatedDate} />
          )}
        </Page>
      )}

      {/* Section Contrôle/Résultats - Page séparée */}
      {activeSections.some(s => s.type === 'control') && report && (
        <Page size="A4" style={styles.page}>
          {options.includeHeader && (
            <PageHeader 
              clientName={report.clientName}
              trialCode={report.testCode}
              pageNumber={"Contrôle"}
            />
          )}
          {(() => {
            try {
              return <ControlSectionPDF report={report} />;
            } catch (error) {
              console.error('❌ Error rendering ControlSectionPDF:', error);
              return (
                <Section title="CONTRÔLE">
                  <Text style={{ fontSize: 12, color: 'red', textAlign: 'center', marginTop: 50 }}>
                    Erreur lors du rendu de la section contrôle
                  </Text>
                  <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 10 }}>
                    {error.message}
                  </Text>
                </Section>
              );
            }
          })()}
          {options.includeFooter && (
            <PageFooter generatedDate={generatedDate} />
          )}
        </Page>
      )}
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
