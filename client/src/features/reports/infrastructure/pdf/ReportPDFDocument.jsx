/**
 * INFRASTRUCTURE: Composant PDF avec React-PDF
 * Template principal du document PDF
 * 
 * Refactorisé pour utiliser le système de thème centralisé
 */

import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import {
  IdentificationSectionPDF,
  MicrographySectionPDF,
  CurvesSectionPDF,
  DatapaqSectionPDF,
  PostTreatmentSectionPDF,
  ObservationsSectionPDF,
  LoadSectionPDF,
  RecipeSectionPDF,
  ControlSectionPDF
} from './sections';
import { CommonReportHeader } from './components/CommonReportHeader';
import { CommonReportFooter } from './components/CommonReportFooter';
import { COLORS, TYPOGRAPHY, SPACING, COMMON_STYLES } from './theme';

/**
 * Styles globaux du PDF - utilisant le thème
 */
const styles = StyleSheet.create({
  page: {
    ...COMMON_STYLES.page,
    paddingBottom: 60, // Espace pour le footer
    paddingTop: 20,
  },
  // pageFooter removed - replaced by component
  section: {
    marginBottom: SPACING.section.marginBottom
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    color: COLORS.brand.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.brand.primary,
    paddingBottom: SPACING.xs
  },
  row: {
    flexDirection: 'row',
    marginBottom: SPACING.xs
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
    marginVertical: SPACING.md
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  photoItem: {
    width: '48%',
    marginBottom: SPACING.md
  },
  photoImage: {
    width: '100%',
    maxHeight: 200,
    objectFit: 'contain'
  },
  photoCaption: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginTop: 2,
    color: COLORS.text.secondary
  }
});

/**
 * Pied de page
 */


/**
 * Page de garde moderne
 */
/**
 * Page de garde moderne - Redesign
 */
export const CoverPage = ({ report, options }) => {
  if (!report) return null;

  const trialData = report.trialData || {};
  const partData = report.partData || report.part || {};

  // Styles spécifiques pour la page de garde
  const coverStyles = StyleSheet.create({
    sectionHeader: {
      backgroundColor: COLORS.brand.dark,
      paddingVertical: 4,
      paddingHorizontal: 10,
      marginBottom: 8,
      marginTop: 4,
    },
    sectionHeaderText: {
      color: '#ffffff',
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
    },
    row: {
      flexDirection: 'row',
      marginBottom: 5,
    },
    label: {
      width: '30%',
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: COLORS.text.secondary,
      textTransform: 'uppercase',
    },
    value: {
      flex: 1,
      fontSize: 9,
      color: COLORS.text.primary,
    },
    techSpecRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    techSpecItem: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 5,
    },
    techSpecLabel: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: COLORS.text.secondary,
    },
    techSpecValue: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: COLORS.text.primary,
    },

    // Treatment Cycle Table
    cycleTable: {
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: COLORS.brand.primary,
      marginTop: 5,
    },
    cycleColumn: {
      flex: 1,
      borderRightWidth: 1,
      borderRightColor: COLORS.brand.primary,
    },
    cycleHeader: {
      backgroundColor: '#2563eb', // Blue similar to image
      padding: 5,
      color: '#ffffff',
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
    },
    cycleContent: {
      padding: 5,
      fontSize: 9,
      minHeight: 60,
    },
    noBorderRight: {
      borderRightWidth: 0,
    },

    // Results/Observations
    resultsBox: {
      borderWidth: 1,
      borderColor: COLORS.brand.dark,
      // backgroundColor: '#dcfce7', // Removed green background
      padding: 10,
      minHeight: 40,
      fontSize: 9,
    },
    resultsLabel: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 2
    }
  });

  return (
    <Page size="A4" style={styles.page}>

      {/* 1. Common Header */}
      <CommonReportHeader
        clientName={report.clientName}
        loadNumber={trialData.load_number}
        trialDate={trialData.trial_date}
        processType={trialData.processTypeRef?.name || trialData.process_type}
        trialCode={report.testCode} // Ensure Test Code is shown if needed, usually Header handles title
      />

      {/* Main Content Container - Flex 1 to allow conclusion to grow */}
      <View style={{ flex: 1, flexDirection: 'column' }}>

        {/* 2. Part Description */}
        <View style={coverStyles.sectionHeader}>
          <Text style={coverStyles.sectionHeaderText}>PART DESCRIPTION</Text>
        </View>
        <View style={{ paddingHorizontal: 10 }}>
          <View style={coverStyles.row}>
            <Text style={coverStyles.label}>CLIENT DESIGNATION:</Text>
            <Text style={coverStyles.value}>{partData.client_designation || 'Not specified'}</Text>
          </View>
          <View style={coverStyles.row}>
            <Text style={coverStyles.label}>STEEL GRADE:</Text>
            <Text style={coverStyles.value}>{partData.steel?.grade || partData.steelGrade || 'Not specified'}</Text>
          </View>
        </View>




        {/* 3. Technical Specifications */}
        <View style={coverStyles.sectionHeader}>
          <Text style={coverStyles.sectionHeaderText}>TECHNICAL SPECIFICATIONS</Text>
        </View>
        <View style={{ paddingHorizontal: 10, ...coverStyles.techSpecRow }}>
          {/* Helper function defined inside render or use logic inline */}
          {(() => {
            const formatSpecValue = (min, max, unit) => {
              const isValid = (val) => val !== null && val !== undefined && val !== '';

              if (isValid(min) && isValid(max)) return `${min}-${max} ${unit}`;
              if (isValid(min)) return `>= ${min} ${unit}`;
              if (isValid(max)) return `<= ${max} ${unit}`;
              return `- ${unit}`;
            };

            return (
              <>
                {/* Hardness Column */}
                {partData.hardnessSpecs && partData.hardnessSpecs.length > 0 && (
                  <View style={{ width: '48%' }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 2, color: COLORS.text.secondary }}>Hardness:</Text>
                    {partData.hardnessSpecs.map((spec, index) => (
                      <React.Fragment key={`hardness-${index}`}>
                        {(spec.min || spec.max) && (
                          <View style={coverStyles.techSpecItem}>
                            <Text style={coverStyles.techSpecLabel}>{spec.name || 'Hardness'}:</Text>
                            <Text style={coverStyles.techSpecValue}>{formatSpecValue(spec.min, spec.max, spec.unit || 'HV')}</Text>
                          </View>
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                )}

                {/* ECD Column */}
                {partData.ecdSpecs && partData.ecdSpecs.length > 0 && (
                  <View style={{ width: '48%' }}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 2, color: COLORS.text.secondary }}>ECD:</Text>
                    {partData.ecdSpecs.map((spec, index) => (
                      <React.Fragment key={`ecd-${index}`}>
                        {(spec.depthMin != null || spec.depthMax != null) && (
                          <View style={coverStyles.techSpecItem}>
                            <Text style={coverStyles.techSpecLabel}>{spec.name || 'ECD'}:</Text>
                            <Text style={coverStyles.techSpecValue}>{formatSpecValue(spec.depthMin, spec.depthMax, spec.depthUnit || 'mm')}</Text>
                          </View>
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                )}
              </>
            );
          })()}

          {/* No specs message */}
          {(!partData.hardnessSpecs || partData.hardnessSpecs.length === 0) &&
            (!partData.ecdSpecs || partData.ecdSpecs.length === 0) && (
              <Text style={{ fontSize: 9, color: '#999', fontStyle: 'italic' }}>No specifications defined.</Text>
            )}
        </View>

        {/* 4. Treatment Cycle (Placeholder) */}
        <View style={coverStyles.sectionHeader}>
          <Text style={coverStyles.sectionHeaderText}>TREATMENT CYCLE</Text>
        </View>
        <View style={coverStyles.cycleTable}>
          {/* Global */}
          <View style={coverStyles.cycleColumn}>
            <Text style={coverStyles.cycleHeader}>Global</Text>
            <View style={coverStyles.cycleContent}>
              <Text>Heating time : x mn</Text>
              <Text>Treatment time : X mn</Text>
              <Text>Total cycle time : x h</Text>
            </View>
          </View>
          {/* Heating */}
          <View style={coverStyles.cycleColumn}>
            <Text style={coverStyles.cycleHeader}>Heating</Text>
            <View style={coverStyles.cycleContent}>
              <Text>Gas 1 : flow x NL/s + time x s</Text>
              <Text>Gas 2 : flow x (NL/s) + time x s</Text>
              <Text>Pressure : x mb</Text>
            </View>
          </View>
          {/* Cooling */}
          <View style={[coverStyles.cycleColumn, coverStyles.noBorderRight]}>
            <Text style={coverStyles.cycleHeader}>Cooling</Text>
            <View style={coverStyles.cycleContent}>
              <Text>Pressure : x bar</Text>
              <Text>Fan speed : x rpm</Text>
            </View>
          </View>
        </View>

        {/* 5. Results */}
        <View style={coverStyles.sectionHeader}>
          <Text style={coverStyles.sectionHeaderText}>RESULTS</Text>
        </View>
        <View style={{ paddingHorizontal: 0 }}>
          {/* Removed Flux */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Text style={[coverStyles.resultsLabel, { width: 80, marginTop: 5 }]}>Observations :</Text>
            <View style={{ flex: 1, ...coverStyles.resultsBox }}>
              <Text>{trialData.observation || ''}</Text>
            </View>
          </View>
        </View>

        {/* 6. Conclusions */}
        {/* Container principal flex pour que la conclusion prenne tout l'espace restant */}
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <View style={{ ...coverStyles.sectionHeader, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={coverStyles.sectionHeaderText}>CONCLUSIONS</Text>
            {/* Status moved to Header */}
            <Text style={{ color: '#ffffff', fontSize: 10, fontFamily: 'Helvetica-Bold' }}>
              Status: {trialData.status || '-'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
            {/* Conclusion Main Box - Flex 1 to fill remaining space */}
            <View style={{ flex: 1, flexDirection: 'column' }}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 2 }}>
                <Text style={coverStyles.resultsLabel}>Conclusion:</Text>
              </View>
              <View style={{ ...coverStyles.resultsBox, flex: 1, minHeight: 0 }}>
                {(() => {
                  const text = trialData.conclusion || '';
                  const MAX_CHARS = 1500; // Approx max chars for a full page box

                  // Dynamic Font Size Calculation
                  let fontSize = 9;
                  if (text.length > 800) fontSize = 7;
                  else if (text.length > 500) fontSize = 8;

                  return (
                    <Text style={{ fontSize: fontSize }}>{text}</Text>
                  );
                })()}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <CommonReportFooter generatedDate={new Date().toLocaleDateString('fr-FR')} pagination="1 / X" />
    </Page>
  );
};

/**
 * Carte d'information moderne
 */
const InfoCard = ({ label, value, highlight }) => (
  <View style={{
    width: '30%',
    padding: 15,
    backgroundColor: highlight ? COLORS.status.successLight : COLORS.background.white,
    borderWidth: 1,
    borderColor: highlight ? COLORS.status.success : COLORS.border.light,
    borderRadius: 4,
    minHeight: 70
  }}>
    <Text style={{
      fontSize: 8,
      color: COLORS.text.secondary,
      marginBottom: 6,
      letterSpacing: 0.5
    }}>
      {label}
    </Text>
    <Text style={{
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: highlight ? '#2e7d32' : COLORS.brand.dark
    }}>
      {value || '-'}
    </Text>
  </View>
);

/**
 * Item de spécification
 */
const SpecItem = ({ label, value }) => (
  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
    <Text style={{ fontSize: 8, color: COLORS.text.secondary, marginRight: 4 }}>{label}:</Text>
    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: COLORS.status.warning }}>{value}</Text>
  </View>
);

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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

/**
 * Helper pour normaliser les photos organisées vers un format simple
 */
const normalizePhotosForSection = (photos, sectionType) => {
  if (!photos) return [];

  // Si c'est déjà un tableau, le retourner tel quel
  if (Array.isArray(photos)) {
    return photos.map(photo => {
      // Construire l'URL si elle n'existe pas
      let photoUrl = photo.url || photo.viewPath;

      if (photoUrl && photoUrl.startsWith('/')) {
        // Si chemin relatif, ajouter l'URL de l'API (sans /api si déjà inclus ou ajuster)
        // API_URL est souvent http://localhost:5001/api
        // photoUrl est /api/files/123
        // On veut http://localhost:5001/api/files/123

        // Si API_URL finit par /api et photoUrl commence par /api, on a un doublon
        const baseUrl = API_URL.endsWith('/api') && photoUrl.startsWith('/api')
          ? API_URL.slice(0, -4)
          : API_URL;

        // Si baseUrl finit par / et photoUrl commence par /, enlever un /
        if (baseUrl.endsWith('/') && photoUrl.startsWith('/')) {
          photoUrl = `${baseUrl.slice(0, -1)}${photoUrl}`;
        } else if (!baseUrl.endsWith('/') && !photoUrl.startsWith('/')) {
          photoUrl = `${baseUrl}/${photoUrl}`;
        } else {
          photoUrl = `${baseUrl}${photoUrl}`;
        }
      } else if (!photoUrl && photo.id) {
        photoUrl = `${API_URL}/files/${photo.id}`;
      }

      return {
        ...photo,
        url: photoUrl,
        original_name: photo.name || photo.original_name,
      };
    });
  }

  // Si c'est un objet organisé, l'aplatir en tableau
  if (typeof photos === 'object') {
    const flatPhotos = [];

    Object.keys(photos).forEach(categoryKey => {
      const categoryPhotos = photos[categoryKey];

      if (Array.isArray(categoryPhotos)) {
        // Ajouter les métadonnées de catégorie si elles n'existent pas
        categoryPhotos.forEach(photo => {
          // Construire l'URL si elle n'existe pas
          let photoUrl = photo.url || photo.viewPath;

          if (photoUrl && photoUrl.startsWith('/')) {
            const baseUrl = API_URL.endsWith('/api') && photoUrl.startsWith('/api')
              ? API_URL.slice(0, -4)
              : API_URL;

            if (baseUrl.endsWith('/') && photoUrl.startsWith('/')) {
              photoUrl = `${baseUrl.slice(0, -1)}${photoUrl}`;
            } else if (!baseUrl.endsWith('/') && !photoUrl.startsWith('/')) {
              photoUrl = `${baseUrl}/${photoUrl}`;
            } else {
              photoUrl = `${baseUrl}${photoUrl}`;
            }
          } else if (!photoUrl && photo.id) {
            photoUrl = `${API_URL}/files/${photo.id}`;
          }

          flatPhotos.push({
            ...photo,
            category: photo.category || categoryKey,
            subcategory: photo.subcategory || categoryKey,
            url: photoUrl,
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

  // Appliquer les valeurs par défaut pour les options
  const {
    includeHeader = true,
    includeFooter = true
  } = options;

  // Log pour déboguer les options
  console.log('🔍 ReportPDFDocument options:', { includeHeader, includeFooter });

  if (process.env.NODE_ENV === 'development') {

  }

  const generatedDate = new Date().toLocaleDateString('fr-FR');

  /**
   * Helper pour vérifier si une section a du contenu réel
   * Basé sur les photos sélectionnées et les données du rapport
   */
  const sectionHasContent = (sectionType) => {
    // Compter les photos pour cette section
    const photos = selectedPhotos?.[sectionType];
    const hasPhotos = photos && (
      (Array.isArray(photos) && photos.length > 0) ||
      (typeof photos === 'object' && Object.keys(photos).length > 0)
    );

    // Vérifier les données selon le type de section
    switch (sectionType) {
      case 'coverPage':
      case 'identification':
      case 'load':
        // Ces sections ont toujours du contenu si elles sont liées à un trial
        return true;
      case 'recipe':
        // Recipe a du contenu si on a des données de recette
        return !!(report.recipeData || report.trialData?.recipe_data);
      case 'curves':
      case 'datapaq':
      case 'micrography':
      case 'postTreatment':
        // Ces sections nécessitent des photos
        return hasPhotos;
      case 'control':
        // Contrôle a du contenu si on a des résultats OU des photos
        const hasResults = !!(report.resultsData || report.trialData?.results_data);
        return hasResults || hasPhotos;
      case 'observations':
        // Observations a du contenu si on a du texte OU des photos
        const hasObservationText = !!(report.trial?.observation || report.trialData?.observation);
        return hasObservationText || hasPhotos;
      default:
        return hasPhotos;
    }
  };

  // Récupérer les sections actives de manière sécurisée et les trier par order
  let activeSections = [];
  try {
    if (Array.isArray(report.sections)) {
      activeSections = report.sections.filter(s => s && s.isEnabled).sort((a, b) => (a.order || 0) - (b.order || 0));
    } else if (report.getActiveSections && typeof report.getActiveSections === 'function') {
      activeSections = report.getActiveSections().sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  } catch (error) {
    console.error('❌ Error getting active sections:', error);
    activeSections = [];
  }

  // Vérifier si la page de garde est activée
  const shouldShowCoverPage = activeSections.some(s => s.type === 'coverPage');

  // Compter uniquement les sections de contenu (hors coverPage) pour vérifier si le rapport a du contenu
  const contentSections = activeSections.filter(s => s.type !== 'coverPage');
  const hasActiveSections = contentSections.length > 0;

  return (
    <Document
      title={report.getTitle?.() || `Rapport d'essai ${report.testCode || 'Sans code'}`}
      author={report.clientName || 'ECM'}
      subject={`Rapport d'essai ${report.testCode || ''}`}
      creator="ECM Synergia"
      producer="ECM Synergia"
    >
      {/* Page de garde */}
      {shouldShowCoverPage && (
        <CoverPage report={report} options={options} />
      )}

      {/* Page d'information si aucune section de contenu ET pas de cover page */}
      {!hasActiveSections && !shouldShowCoverPage && (
        <Page size="A4" style={styles.page}>
          {includeHeader && (
            <CommonReportHeader
              clientName={report.clientName}
              trialCode={report.testCode}
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
          {includeFooter && (
            <CommonReportFooter generatedDate={generatedDate} />
          )}
        </Page>
      )}

      {/* Section Identification - Page séparée */}
      {activeSections.some(s => s.type === 'identification') && report && (
        <Page size="A4" style={styles.page}>
          {includeHeader && (
            <CommonReportHeader
              clientName={report.clientName}
              loadNumber={report.trialData?.load_number}
              trialDate={report.trialData?.trial_date}
              processType={report.trialData?.processTypeRef?.name || report.trialData?.process_type}
            />
          )}
          {(() => {
            try {
              // UNIQUEMENT utiliser les photos sélectionnées manuellement
              const normalizedPhotos = normalizePhotosForSection(selectedPhotos?.identification, 'identification');
              console.log('🔍 PDF Identification - Photos normalisées:', normalizedPhotos.map(p => ({ id: p.id, url: p.url })));
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
          {includeFooter && (
            <CommonReportFooter generatedDate={generatedDate} />
          )}
        </Page>
      )}

      {/* Section Charge - Page séparée */}
      {activeSections.some(s => s.type === 'load') && report && (
        <Page size="A4" style={styles.page}>
          {includeHeader && (
            <CommonReportHeader
              clientName={report.clientName}
              loadNumber={report.trialData?.load_number}
              trialDate={report.trialData?.trial_date}
              processType={report.trialData?.processTypeRef?.name || report.trialData?.process_type}
            />
          )}
          {(() => {
            try {
              // UNIQUEMENT utiliser les photos sélectionnées manuellement
              const normalizedPhotos = normalizePhotosForSection(selectedPhotos?.load, 'load');
              console.log('🔍 PDF Load - Photos normalisées:', normalizedPhotos.map(p => ({ id: p.id, url: p.url })));
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
          {includeFooter && (
            <CommonReportFooter generatedDate={generatedDate} />
          )}
        </Page>
      )}

      {/* Section Courbes - Page séparée (seulement si a du contenu) */}
      {activeSections.some(s => s.type === 'curves') && report && sectionHasContent('curves') && (
        <Page size="A4" style={styles.page}>
          {includeHeader && (
            <CommonReportHeader
              clientName={report.clientName}
              loadNumber={report.trialData?.load_number}
              trialDate={report.trialData?.trial_date}
              processType={report.trialData?.processTypeRef?.name || report.trialData?.process_type}
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
          {includeFooter && (
            <CommonReportFooter generatedDate={generatedDate} />
          )}
        </Page>
      )}

      {/* Section Datapaq - Page séparée (seulement si a du contenu) */}
      {activeSections.some(s => s.type === 'datapaq') && report && sectionHasContent('datapaq') && (
        <Page size="A4" style={styles.page}>
          {includeHeader && (
            <CommonReportHeader
              clientName={report.clientName}
              loadNumber={report.trialData?.load_number}
              trialDate={report.trialData?.trial_date}
              processType={report.trialData?.processTypeRef?.name || report.trialData?.process_type}
            />
          )}
          {(() => {
            try {
              const normalizedPhotos = normalizePhotosForSection(selectedPhotos?.datapaq, 'datapaq');
              return (
                <DatapaqSectionPDF
                  report={report}
                  photos={normalizedPhotos}
                />
              );
            } catch (error) {
              console.error('❌ Error rendering DatapaqSectionPDF:', error);
              return (
                <Section title="RAPPORTS DATAPAQ">
                  <Text style={{ fontSize: 12, color: 'red', textAlign: 'center', marginTop: 50 }}>
                    Erreur lors du rendu de la section Datapaq
                  </Text>
                  <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 10 }}>
                    {error.message}
                  </Text>
                </Section>
              );
            }
          })()}
          {includeFooter && (
            <CommonReportFooter generatedDate={generatedDate} />
          )}
        </Page>
      )}

      {/* Section Post-traitement - Page séparée (seulement si a du contenu) */}
      {activeSections.some(s => s.type === 'postTreatment') && report && sectionHasContent('postTreatment') && (
        <Page size="A4" style={styles.page}>
          {includeHeader && (
            <CommonReportHeader
              clientName={report.clientName}
              loadNumber={report.trialData?.load_number}
              trialDate={report.trialData?.trial_date}
              processType={report.trialData?.processTypeRef?.name || report.trialData?.process_type}
            />
          )}
          {(() => {
            try {
              const normalizedPhotos = normalizePhotosForSection(selectedPhotos?.postTreatment, 'postTreatment');
              return (
                <PostTreatmentSectionPDF
                  report={report}
                  photos={normalizedPhotos}
                />
              );
            } catch (error) {
              console.error('❌ Error rendering PostTreatmentSectionPDF:', error);
              return (
                <Section title="POST-TRAITEMENT">
                  <Text style={{ fontSize: 12, color: 'red', textAlign: 'center', marginTop: 50 }}>
                    Erreur lors du rendu de la section Post-traitement
                  </Text>
                  <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 10 }}>
                    {error.message}
                  </Text>
                </Section>
              );
            }
          })()}
          {includeFooter && (
            <CommonReportFooter generatedDate={generatedDate} />
          )}
        </Page>
      )}

      {/* Section Observations - Page séparée */}
      {(() => {
        // Vérifier si la section observations est activée
        if (!activeSections.some(s => s.type === 'observations') || !report) return null;

        // Vérifier si on a du contenu (observation text ou photos)
        const observationText = report.trial?.observation || report.trialData?.observation || '';
        const observationPhotos = normalizePhotosForSection(selectedPhotos?.observations, 'observations');
        if (!observationText && (!observationPhotos || observationPhotos.length === 0)) return null;

        return (
          <Page size="A4" style={styles.page}>
            {includeHeader && (
              <CommonReportHeader
                clientName={report.clientName}
                loadNumber={report.trialData?.load_number}
                trialDate={report.trialData?.trial_date}
                processType={report.trialData?.processTypeRef?.name || report.trialData?.process_type}
              />
            )}
            {(() => {
              try {
                return (
                  <ObservationsSectionPDF
                    report={report}
                    photos={observationPhotos}
                  />
                );
              } catch (error) {
                console.error('❌ Error rendering ObservationsSectionPDF:', error);
                return (
                  <Section title="OBSERVATIONS">
                    <Text style={{ fontSize: 12, color: 'red', textAlign: 'center', marginTop: 50 }}>
                      Erreur lors du rendu de la section Observations
                    </Text>
                    <Text style={{ fontSize: 10, color: '#666', textAlign: 'center', marginTop: 10 }}>
                      {error.message}
                    </Text>
                  </Section>
                );
              }
            })()}
            {includeFooter && (
              <CommonReportFooter generatedDate={generatedDate} />
            )}
          </Page>
        );
      })()}

      {/* Section Recette - Page séparée */}
      {(() => {
        // Vérifier si la section recipe est activée
        if (!activeSections.some(s => s.type === 'recipe') || !report) return null;

        // Vérifier si on a des données de recette
        const hasRecipeData = !!(report.recipeData || report.quenchData || report.trialData?.recipe_data);
        if (!hasRecipeData) return null;

        // Vérifier si au moins une option est activée
        const recipeSection = activeSections.find(s => s.type === 'recipe');
        const showRecipeDetails = recipeSection?.options?.showRecipeDetails !== false;
        const showRecipeCurve = recipeSection?.options?.showRecipeCurve !== false;
        if (!showRecipeDetails && !showRecipeCurve) return null;

        return (
          <Page size="A4" style={styles.page}>
            {includeHeader && (
              <CommonReportHeader
                clientName={report.clientName}
                loadNumber={report.trialData?.load_number}
                trialDate={report.trialData?.trial_date}
                processType={report.trialData?.processTypeRef?.name || report.trialData?.process_type}
              />
            )}
            {(() => {
              try {
                return <RecipeSectionPDF report={report} showRecipeDetails={showRecipeDetails} showRecipeCurve={showRecipeCurve} />;
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
            {includeFooter && (
              <CommonReportFooter generatedDate={generatedDate} />
            )}
          </Page>
        );
      })()}

      {/* Section Contrôle/Résultats - Page séparée */}
      {activeSections.some(s => s.type === 'control') && report && (
        <Page size="A4" style={styles.page}>
          {includeHeader && (
            <CommonReportHeader
              clientName={report.clientName}
              loadNumber={report.trialData?.load_number}
              trialDate={report.trialData?.trial_date}
              processType={report.trialData?.processTypeRef?.name || report.trialData?.process_type}
            />
          )}
          {(() => {
            try {
              // Même principe que micrography : normaliser les photos en tableau simple
              const normalizedPhotos = normalizePhotosForSection(
                selectedPhotos?.control || selectedPhotos?.controlLocation,
                'control'
              );

              return <ControlSectionPDF report={report} photos={normalizedPhotos} />;
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
          {includeFooter && (
            <CommonReportFooter generatedDate={generatedDate} />
          )}
        </Page>
      )}

      {/* Section Micrographie - Page séparée (seulement si a du contenu) */}
      {activeSections.some(s => s.type === 'micrography') && report && sectionHasContent('micrography') && (
        <Page size="A4" style={styles.page}>
          {includeHeader && (
            <CommonReportHeader
              clientName={report.clientName}
              loadNumber={report.trialData?.load_number}
              trialDate={report.trialData?.trial_date}
              processType={report.trialData?.processTypeRef?.name || report.trialData?.process_type}
            />
          )}
          {(() => {
            try {
              const normalizedPhotos = normalizePhotosForSection(selectedPhotos?.micrography, 'micrography');
              // Récupérer aussi les photos de control location pour les afficher dans micrography
              const controlLocationPhotos = normalizePhotosForSection(
                selectedPhotos?.control || selectedPhotos?.controlLocation,
                'control'
              );
              return (
                <MicrographySectionPDF
                  report={report}
                  photos={normalizedPhotos}
                  controlLocationPhotos={controlLocationPhotos}
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
          {includeFooter && (
            <CommonReportFooter generatedDate={generatedDate} />
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
        <CommonReportHeader
          clientName={clientData?.name}
          trialCode={trialData?.trial_code}
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
        <CommonReportFooter generatedDate={generatedDate} />
      )}
    </Page>
  );
};

/**
 * Contenu spécifique d'une section
 */
const SectionContent = ({ section, report, options }) => {
  const { partData, clientData } = report;

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
