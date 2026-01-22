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
export const CoverPage = ({ report, options }) => {
  const logoEcmUrl = '/images/logoECM.png';
  const logoSynergyUrl = '/images/synergy_logo.png';

  return (
    <Page size="A4" style={{ position: 'relative' }}>
      {/* Bandeau supérieur avec logos */}
      <View style={{
        backgroundColor: COLORS.brand.dark,
        padding: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 32,
            fontFamily: 'Helvetica-Bold',
            color: COLORS.text.white,
            letterSpacing: 1.5
          }}>
            Trial Report
          </Text>
          <Text style={{
            fontSize: 10,
            color: COLORS.brand.primary,
            marginTop: 8,
            letterSpacing: 1
          }}>
            Quality Control & Heat Treatment
          </Text>
        </View>
        {/* Logos ECM et Synergy */}
        <View style={{ alignItems: 'center' }}>
          {logoEcmUrl && (
            <Image
              src={logoEcmUrl}
              style={{
                width: 100,
                height: 100,
                objectFit: 'contain'
              }}
            />
          )}
          {logoSynergyUrl && (
            <Image
              src={logoSynergyUrl}
              style={{
                width: 120,
                height: 40,
                objectFit: 'contain',
                marginTop: 8
              }}
            />
          )}
        </View>
      </View>

      {/* Section client - Mise en avant */}
      <View style={{
        backgroundColor: COLORS.background.light,
        padding: 25,
        borderLeftWidth: 6,
        borderLeftColor: COLORS.brand.primary,
        marginTop: 40,
        marginHorizontal: 40
      }}>
        <Text style={{
          fontSize: 11,
          color: COLORS.text.secondary,
          marginBottom: 8,
          letterSpacing: 0.5
        }}>
          CLIENT
        </Text>
        <Text style={{
          fontSize: 20,
          fontFamily: 'Helvetica-Bold',
          color: COLORS.brand.dark,
          marginBottom: 5
        }}>
          {report.clientName || 'Not specified'}
        </Text>
        {report.contact && (
          <Text style={{ fontSize: 9, color: COLORS.text.secondary, marginTop: 4 }}>
            Contact: {report.contact}
          </Text>
        )}
      </View>

      {/* Informations essai - Grille moderne */}
      <View style={{
        marginTop: 30,
        marginHorizontal: 40,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15
      }}>
        <InfoCard label="Test Code" value={report.testCode} />
        <InfoCard label="Test Date" value={report.testDate ? new Date(report.testDate).toLocaleDateString('en-US') : '-'} />
        <InfoCard label="Part" value={report.partName} />
        <InfoCard label="Status" value={report.status} highlight={report.status === 'Complete' || report.status === 'Termine'} />
        <InfoCard label="Location" value={report.location} />
        <InfoCard label="Treatment" value={report.processType || report.trialData?.process_type || '-'} />
      </View>

      {/* Section spécifications */}
      {report.part?.specifications && (
        <View style={{
          marginTop: 30,
          marginHorizontal: 40,
          padding: 20,
          backgroundColor: '#fff8f0',
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#ffe4cc'
        }}>
          <Text style={{
            fontSize: 10,
            fontFamily: 'Helvetica-Bold',
            color: COLORS.status.warning,
            marginBottom: 10
          }}>
            Technical Specifications
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15 }}>
            {report.part.specifications.targetHardness && (
              <SpecItem label="Target Hardness" value={`${report.part.specifications.targetHardness} HV`} />
            )}
            {report.part.specifications.minHardness && (
              <SpecItem label="Min Hardness" value={`${report.part.specifications.minHardness} HV`} />
            )}
            {report.part.specifications.maxHardness && (
              <SpecItem label="Max Hardness" value={`${report.part.specifications.maxHardness} HV`} />
            )}
            {report.part.specifications.ecdTarget && (
              <SpecItem label="Target ECD" value={`${report.part.specifications.ecdTarget} mm`} />
            )}
          </View>
        </View>
      )}

      {/* Pied de page */}
      <View style={{
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: COLORS.border.light,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <View>
          <Text style={{ fontSize: 8, color: COLORS.text.muted, marginBottom: 2 }}>Confidential Document</Text>
          <Text style={{ fontSize: 7, color: COLORS.border.medium }}>
            Generated on {new Date().toLocaleDateString('en-US')} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={{ fontSize: 8, color: COLORS.brand.primary, fontFamily: 'Helvetica-Bold' }}>
          ECM - Excellence in Metallurgical Control
        </Text>
      </View>
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
    includeFooter = true,
    includeCoverPage = true
  } = options;

  // Log pour déboguer les options
  console.log('🔍 ReportPDFDocument options:', { includeHeader, includeFooter, includeCoverPage });

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
        // Ces sections nécessitent des photos
        return hasPhotos;
      case 'control':
        // Contrôle a du contenu si on a des résultats OU des photos
        const hasResults = !!(report.resultsData || report.trialData?.results_data);
        return hasResults || hasPhotos;
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
      {includeCoverPage !== false && (
        <CoverPage report={report} options={options} />
      )}

      {/* Page d'information si aucune section */}
      {!hasActiveSections && (
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

      {/* Section Recette - Page séparée */}
      {activeSections.some(s => s.type === 'recipe') && report && (
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
              // Récupérer les options showRecipeDetails et showRecipeCurve depuis la section
              const recipeSection = activeSections.find(s => s.type === 'recipe');
              const showRecipeDetails = recipeSection?.options?.showRecipeDetails !== false;
              const showRecipeCurve = recipeSection?.options?.showRecipeCurve !== false;
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
      )}

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
