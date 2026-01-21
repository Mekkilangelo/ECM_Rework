/**
 * INFRASTRUCTURE: Part Identification Section for PDF
 * Displays part identification, specifications, and photos with intelligent layout
 *
 * Layout Strategy:
 * - Page 1: Titre + Données + Specs + 1ère photo (hero 430x180)
 * - Pages suivantes: Grille 2x3 (6 photos par page, 244x155 chacune)
 *
 * Optimisé pour que le texte et la première photo tiennent sur la même page
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme';
import { 
  SectionTitle, 
  SubsectionTitle, 
  DataRow, 
  PhotoContainer,
  EmptyState 
} from '../primitives';
import { validatePhotos } from '../helpers/photoHelpers';

// Section-specific accent color
const SECTION_TYPE = 'identification';

// Styles spécifiques à cette section (non partagés)
const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.section.marginBottom,
  },
  specGrid: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  specRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border.subtle,
  },
  specLabel: {
    ...TYPOGRAPHY.label,
    width: '28%',
    color: COLORS.text.secondary,
  },
  specValue: {
    ...TYPOGRAPHY.value,
    width: '72%',
    color: COLORS.text.primary,
    fontSize: 8.5,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.photo.gap,
  },
});

// Photo sizes specific to Identification section
// Optimisées pour tenir avec le texte + specs sur la même page
const IDENTIFICATION_PHOTO_SIZES = {
  // Première photo : compacte pour laisser place au texte + plusieurs specs
  heroFirst: { width: 430, height: 180 },
  // Photos en grille 2x3 (6 par page) - réduit pour tenir sur une page
  gridItem: { width: 244, height: 155 },
};

/**
 * Helper pour extraire une unité depuis différentes sources possibles
 * Gère: string directe, objet {name: 'unit'}, ou valeur dans nested object
 */
const resolveUnit = (directUnit, relationUnit) => {
  // 1. Priorité à la valeur directe (string FK)
  if (directUnit && typeof directUnit === 'string') {
    return directUnit;
  }
  
  // 2. Essayer depuis l'objet relation Sequelize (relationUnit.name)
  if (relationUnit && typeof relationUnit === 'object' && relationUnit.name) {
    return relationUnit.name;
  }
  
  // 3. Si relationUnit est directement une string
  if (relationUnit && typeof relationUnit === 'string') {
    return relationUnit;
  }
  
  return '';
};

/**
 * Format dimensions helper with explicit labels
 */
const formatDimensions = (part) => {
  const dims = [];

  // Debug: Log toutes les propriétés de part liées aux unités (toujours actif pour debug)
  console.log('[IdentificationPDF] formatDimensions - Part data:', {
    dim_rect_unit: part.dim_rect_unit,
    dim_circ_unit: part.dim_circ_unit,
    dim_weight_unit: part.dim_weight_unit,
    rectUnit: part.rectUnit,
    circUnit: part.circUnit,
    weightUnit: part.weightUnit,
    dim_weight_value: part.dim_weight_value,
    dim_rect_height: part.dim_rect_height
  });

  // Rectangular dimensions with explicit labels
  if (part.dim_rect_length || part.dim_rect_width || part.dim_rect_height) {
    const rectParts = [];
    if (part.dim_rect_length) rectParts.push(`Length: ${part.dim_rect_length}`);
    if (part.dim_rect_width) rectParts.push(`Width: ${part.dim_rect_width}`);
    if (part.dim_rect_height) rectParts.push(`Height: ${part.dim_rect_height}`);

    if (rectParts.length > 0) {
      const unit = resolveUnit(part.dim_rect_unit, part.rectUnit);
      console.log('[IdentificationPDF] Rect unit resolved:', unit, 'from:', { dim_rect_unit: part.dim_rect_unit, rectUnit: part.rectUnit });
      dims.push(`${rectParts.join(' × ')}${unit ? ` ${unit}` : ''}`);
    }
  }

  // Circular dimensions with explicit labels
  if (part.dim_circ_diameterOut || part.dim_circ_diameterIn) {
    const circParts = [];
    if (part.dim_circ_diameterOut) circParts.push(`⌀ Ext: ${part.dim_circ_diameterOut}`);
    if (part.dim_circ_diameterIn) circParts.push(`⌀ Int: ${part.dim_circ_diameterIn}`);

    if (circParts.length > 0) {
      const unit = resolveUnit(part.dim_circ_unit, part.circUnit);
      console.log('[IdentificationPDF] Circ unit resolved:', unit, 'from:', { dim_circ_unit: part.dim_circ_unit, circUnit: part.circUnit });
      dims.push(`${circParts.join(', ')}${unit ? ` ${unit}` : ''}`);
    }
  }

  // Weight with explicit label
  if (part.dim_weight_value) {
    const unit = resolveUnit(part.dim_weight_unit, part.weightUnit);
    console.log('[IdentificationPDF] Weight unit resolved:', unit, 'from:', { dim_weight_unit: part.dim_weight_unit, weightUnit: part.weightUnit });
    dims.push(`Weight: ${part.dim_weight_value}${unit ? ` ${unit}` : ''}`);
  }

  return dims.join(' | ') || '';
};

/**
 * Get steel grade from various possible locations
 */
const getSteelGrade = (partData) => {
  return partData.steel?.grade 
    || partData.steelGrade 
    || partData.steel_grade
    || (typeof partData.steel === 'string' ? partData.steel : null)
    || 'Not specified';
};

/**
 * Calculate layout for Identification section
 * - Page 1: texte + 1ère photo (hero)
 * - Pages suivantes: grille 2x3 (6 photos par page)
 */
const calculateLayout = (photoCount) => {
  if (photoCount === 0) return null;

  const pages = [];

  // Page 1: première photo seulement (avec le texte)
  pages.push({ type: 'hero', indices: [0] });

  // Pages suivantes: grille 2x3 (6 photos par page)
  let currentIndex = 1;
  while (currentIndex < photoCount) {
    const remaining = photoCount - currentIndex;
    const photosThisPage = Math.min(remaining, 6);
    const indices = [];
    for (let i = 0; i < photosThisPage; i++) {
      indices.push(currentIndex + i);
    }
    pages.push({ type: 'grid', indices });
    currentIndex += photosThisPage;
  }

  return pages;
};

/**
 * Hero Photo Layout - First photo with text
 */
const HeroPhotoLayout = ({ photo }) => (
  <PhotoContainer
    photo={photo}
    customSize={IDENTIFICATION_PHOTO_SIZES.heroFirst}
  />
);

/**
 * Grid Photo Layout - 2x2 grid
 */
const GridPhotoLayout = ({ photos }) => (
  <View style={styles.photoGrid}>
    {photos.map((photo, idx) => (
      <PhotoContainer
        key={photo.id || idx}
        photo={photo}
        customSize={IDENTIFICATION_PHOTO_SIZES.gridItem}
      />
    ))}
  </View>
);

/**
 * Specifications Component - Renders hardness and ECD specs
 */
const Specifications = ({ hardnessSpecs, ecdSpecs }) => {
  if (hardnessSpecs.length === 0 && ecdSpecs.length === 0) {
    return null;
  }
  
  return (
    <View style={styles.section} wrap={false}>
      {/* Hardness Specifications */}
      {hardnessSpecs.length > 0 && (
        <>
          <SubsectionTitle sectionType={SECTION_TYPE}>
            Hardness Specifications
          </SubsectionTitle>
          <View style={styles.specGrid}>
            {hardnessSpecs.map((spec, index) => (
              <View key={`hardness-${index}`} style={styles.specRow}>
                <Text style={styles.specLabel}>
                  {spec.name || `Spec ${index + 1}`}:
                </Text>
                <Text style={styles.specValue}>
                  {spec.min && spec.max 
                    ? `${spec.min} - ${spec.max} ${spec.unit || ''}`
                    : spec.min 
                      ? `Min: ${spec.min} ${spec.unit || ''}`
                      : spec.max 
                        ? `Max: ${spec.max} ${spec.unit || ''}`
                        : 'Not specified'}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ECD Specifications */}
      {ecdSpecs.length > 0 && (
        <>
          <SubsectionTitle sectionType={SECTION_TYPE}>
            ECD Specifications
          </SubsectionTitle>
          <View style={styles.specGrid}>
            {ecdSpecs.map((spec, index) => (
              <View key={`ecd-${index}`} style={styles.specRow}>
                <Text style={styles.specLabel}>
                  {spec.name || `ECD ${index + 1}`}:
                </Text>
                <Text style={styles.specValue}>
                  Depth: {spec.depthMin && spec.depthMax 
                    ? `${spec.depthMin} - ${spec.depthMax} ${spec.depthUnit || 'mm'}`
                    : spec.depthMin 
                      ? `Min: ${spec.depthMin} ${spec.depthUnit || 'mm'}`
                      : spec.depthMax 
                        ? `Max: ${spec.depthMax} ${spec.depthUnit || 'mm'}`
                        : 'Not specified'}
                  {spec.hardness && ` | Hardness: ${spec.hardness} ${spec.hardnessUnit || ''}`}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

/**
 * Component: Part Identification Section for PDF
 */
export const IdentificationSectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  // Validate and process photos
  const validPhotos = validatePhotos(photos || []);

  // Extract data from report
  const partData = report.partData || report.part || {};
  
  // DEBUG: Log complet des données partData reçues
  console.log('🔍 [IdentificationSectionPDF] report.partData:', {
    hasPartData: !!report.partData,
    hasPart: !!report.part,
    dim_weight_unit: partData.dim_weight_unit,
    dim_rect_unit: partData.dim_rect_unit,
    dim_circ_unit: partData.dim_circ_unit,
    dim_weight_value: partData.dim_weight_value,
    dim_rect_height: partData.dim_rect_height,
    weightUnit: partData.weightUnit,
    rectUnit: partData.rectUnit,
    allKeys: Object.keys(partData)
  });
  
  const steelGrade = getSteelGrade(partData);
  const hardnessSpecs = partData.hardnessSpecs || [];
  const ecdSpecs = partData.ecdSpecs || [];

  // Calculate layout based on photo count (not separated by views)
  const layout = validPhotos.length > 0 ? calculateLayout(validPhotos.length) : null;

  return (
    <>
      {/* Section Title */}
      <SectionTitle sectionType={SECTION_TYPE}>
        PART IDENTIFICATION
      </SectionTitle>

      {/* Part Identification Data */}
      <View style={styles.section} wrap={false}>
        <DataRow label="Client Designation" value={partData.client_designation} />
        <DataRow label="Reference" value={partData.reference} />
        <DataRow label="Quantity" value={partData.quantity} />
        <DataRow label="Steel Grade" value={steelGrade} />
        <DataRow label="Dimensions" value={formatDimensions(partData)} noBorder />
      </View>

      {/* Specifications */}
      <Specifications hardnessSpecs={hardnessSpecs} ecdSpecs={ecdSpecs} />

      {/* Photos: 1ère avec le texte, reste en grille sur pages suivantes */}
      {layout ? (
        layout.map((page, pageIndex) => {
          const pagePhotos = page.indices.map(idx => validPhotos[idx]);

          return (
            <View
              key={`identification-page-${pageIndex}`}
              style={styles.section}
              break={pageIndex > 0}
            >
              {pageIndex > 0 && (
                <SectionTitle sectionType={SECTION_TYPE} continuation>
                  PART IDENTIFICATION
                </SectionTitle>
              )}

              {page.type === 'hero' && (
                <HeroPhotoLayout photo={pagePhotos[0]} />
              )}

              {page.type === 'grid' && (
                <GridPhotoLayout photos={pagePhotos} />
              )}
            </View>
          );
        })
      ) : (
        <View style={styles.section}>
          <EmptyState message="No identification photos available for this part." />
        </View>
      )}
    </>
  );
};

export default IdentificationSectionPDF;
