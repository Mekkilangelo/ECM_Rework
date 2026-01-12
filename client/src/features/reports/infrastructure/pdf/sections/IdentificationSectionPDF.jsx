/**
 * INFRASTRUCTURE: Part Identification Section for PDF
 * Displays part identification, specifications, and photos organized by view
 * 
 * Refactorisé pour utiliser le système de thème et les primitives
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme';
import { 
  SectionTitle, 
  SubsectionTitle, 
  DataRow, 
  PhotoContainer, 
  PhotoRow, 
  PhotoGrid2,
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
  viewContainer: {
    marginBottom: SPACING.lg,
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
  photoGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: SPACING.photo.gap,
  },
  photoGridItem: {
    width: '48%',
    marginBottom: SPACING.photo.marginBottom,
    alignItems: 'center',
  },
  photoFullContainer: {
    width: '100%',
    marginBottom: SPACING.photo.marginBottom,
    alignItems: 'center',
  },
  photoRowContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.photo.marginBottom,
    justifyContent: 'space-between',
    gap: SPACING.photo.gap,
  },
  pageBreak: {
    marginTop: SPACING.lg,
  },
});

/**
 * Format dimensions helper
 */
const formatDimensions = (part) => {
  const dims = [];
  
  // Rectangular dimensions
  if (part.dim_rect_length || part.dim_rect_width || part.dim_rect_height) {
    const rectDims = [part.dim_rect_length, part.dim_rect_width, part.dim_rect_height]
      .filter(d => d)
      .join(' × ');
    if (rectDims) {
      dims.push(`${rectDims} ${part.dim_rect_unit || 'mm'}`);
    }
  }
  
  // Circular dimensions
  if (part.dim_circ_diameterOut || part.dim_circ_diameterIn) {
    const circDims = [];
    if (part.dim_circ_diameterOut) circDims.push(`⌀ ext: ${part.dim_circ_diameterOut}`);
    if (part.dim_circ_diameterIn) circDims.push(`⌀ int: ${part.dim_circ_diameterIn}`);
    dims.push(`${circDims.join(', ')} ${part.dim_circ_unit || 'mm'}`);
  }
  
  // Weight
  if (part.dim_weight_value) {
    dims.push(`${part.dim_weight_value} ${part.dim_weight_unit || 'kg'}`);
  }
  
  return dims.join(' | ') || 'Not specified';
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
 * Calculate page layout for photos organized by view
 */
const calculatePageLayout = (photosByView) => {
  const layouts = [];
  const pageHeight = 700;
  let currentPage = { views: [], usedHeight: 0 };

  Object.entries(photosByView).forEach(([viewName, photos]) => {
    const photoCount = photos.length;
    
    // Calculate height needed for this view
    let viewHeight = 80; // Header + margins
    
    if (photoCount === 1) {
      viewHeight += 220;
    } else if (photoCount === 2) {
      viewHeight += 200;
    } else if (photoCount <= 4) {
      viewHeight += 360;
    } else if (photoCount <= 6) {
      viewHeight += 540;
    } else {
      viewHeight = pageHeight + 1; // Force new page
    }

    if (currentPage.usedHeight + viewHeight <= pageHeight && currentPage.views.length < 3) {
      currentPage.views.push({ viewName, photos, height: viewHeight });
      currentPage.usedHeight += viewHeight;
    } else {
      if (currentPage.views.length > 0) {
        layouts.push(currentPage);
      }
      currentPage = {
        views: [{ viewName, photos, height: viewHeight }],
        usedHeight: viewHeight
      };
    }
  });

  if (currentPage.views.length > 0) {
    layouts.push(currentPage);
  }

  return layouts;
};

/**
 * Photos View Component - Renders photos for a specific view
 */
const PhotoView = ({ viewName, photos }) => {
  const photoCount = photos.length;
  const displayName = viewName.charAt(0).toUpperCase() + viewName.slice(1);
  
  return (
    <View style={styles.viewContainer}>
      <SubsectionTitle sectionType={SECTION_TYPE}>
        {displayName} View
      </SubsectionTitle>
      
      {photoCount === 1 ? (
        <View style={styles.photoFullContainer}>
          <PhotoContainer 
            photo={photos[0]} 
            size="fullWidth" 
          />
        </View>
      ) : photoCount === 2 ? (
        <View style={styles.photoRowContainer}>
          {photos.map((photo, idx) => (
            <PhotoContainer 
              key={photo.id || idx} 
              photo={photo} 
              size="half" 
            />
          ))}
        </View>
      ) : (
        <View style={styles.photoGridContainer}>
          {photos.slice(0, 6).map((photo, idx) => (
            <View key={photo.id || idx} style={styles.photoGridItem}>
              <PhotoContainer 
                photo={photo} 
                size="gridSmall"
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

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
  const steelGrade = getSteelGrade(partData);
  const hardnessSpecs = partData.hardnessSpecs || [];
  const ecdSpecs = partData.ecdSpecs || [];

  // Group photos by subcategory (view)
  const photosByView = {};
  validPhotos.forEach(photo => {
    const view = photo.subcategory || 'other';
    if (!photosByView[view]) {
      photosByView[view] = [];
    }
    photosByView[view].push(photo);
  });

  const pageLayouts = calculatePageLayout(photosByView);

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

      {/* Photos organized by view */}
      {pageLayouts.length > 0 ? (
        pageLayouts.map((page, pageIndex) => (
          <View 
            key={`photo-page-${pageIndex}`} 
            style={[styles.section, pageIndex > 0 && styles.pageBreak]} 
            wrap={false}
          >
            {pageIndex > 0 && (
              <SectionTitle sectionType={SECTION_TYPE} continuation>
                PART IDENTIFICATION
              </SectionTitle>
            )}
            
            {page.views.map((viewData, viewIndex) => (
              <PhotoView 
                key={`view-${viewData.viewName}-${viewIndex}`}
                viewName={viewData.viewName}
                photos={viewData.photos}
              />
            ))}
          </View>
        ))
      ) : (
        <View style={styles.section}>
          <SubsectionTitle sectionType={SECTION_TYPE}>Photos</SubsectionTitle>
          <EmptyState message="No identification photos available for this part." />
        </View>
      )}
    </>
  );
};

export default IdentificationSectionPDF;
