/**
 * INFRASTRUCTURE: Part Identification Section for PDF
 * Displays part identification, specifications, and photos with intelligent layout
 * 
 * Layout Strategy: Hero-Pair pattern (same as LoadSectionPDF)
 * - Uses photo selection order, not separated by views
 * - 1 photo: full page
 * - 2 photos: stacked vertically
 * - 3+ photos: hero + pair, then grid
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
  photoStack: {
    flexDirection: 'column',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.photo.gap,
  },
});

// Photo sizes specific to Identification section (same as Load section)
const IDENTIFICATION_PHOTO_SIZES = {
  fullPage: { width: 500, height: 700 },
  halfPage: { width: 500, height: 340 },
  heroLarge: { width: 500, height: 280 },
  pairSmall: { width: 244, height: 200 },
  gridItem: { width: 244, height: 240 },
};

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
 * Calculate intelligent layout based on photo count (same as LoadSectionPDF)
 * - 1 photo: full page
 * - 2 photos: stacked vertically  
 * - 3 photos: hero + pair (1 large + 2 small)
 * - 4+ photos: first page = hero + pair, then grid 2x2
 */
const calculateLayout = (photoCount) => {
  if (photoCount === 1) {
    return { type: 'single', pages: [[0]] };
  } else if (photoCount === 2) {
    return { type: 'double', pages: [[0, 1]] };
  } else if (photoCount === 3) {
    return { type: 'triple', pages: [[0, 1, 2]] };
  } else {
    // 4+ photos: first page = 3 (hero + pair), then grid 2x2
    const pages = [];
    let currentIndex = 0;
    
    // First page with special layout
    pages.push([0, 1, 2]);
    currentIndex = 3;
    
    // Following pages with grid (4 photos max per page)
    while (currentIndex < photoCount) {
      const remaining = photoCount - currentIndex;
      const photosThisPage = Math.min(remaining, 4);
      const pageIndices = [];
      for (let i = 0; i < photosThisPage; i++) {
        pageIndices.push(currentIndex + i);
      }
      pages.push(pageIndices);
      currentIndex += photosThisPage;
    }
    
    return { type: 'multiple', pages };
  }
};

/**
 * Single Photo Layout - Full page
 */
const SinglePhotoLayout = ({ photo }) => (
  <PhotoContainer 
    photo={photo} 
    customSize={IDENTIFICATION_PHOTO_SIZES.fullPage}
  />
);

/**
 * Double Photo Layout - Stacked vertically
 */
const DoublePhotoLayout = ({ photos }) => (
  <View style={styles.photoStack}>
    {photos.map((photo, idx) => (
      <PhotoContainer 
        key={photo.id || idx}
        photo={photo} 
        customSize={IDENTIFICATION_PHOTO_SIZES.halfPage}
      />
    ))}
  </View>
);

/**
 * Triple Photo Layout - Hero + Pair pattern
 * 1 large photo on top, 2 smaller photos below side by side
 */
const TriplePhotoLayout = ({ photos }) => {
  const [heroPhoto, ...pairPhotos] = photos;
  
  return (
    <View style={styles.photoStack}>
      {/* Hero photo */}
      <PhotoContainer 
        photo={heroPhoto} 
        customSize={IDENTIFICATION_PHOTO_SIZES.heroLarge}
      />
      
      {/* Pair row */}
      <View style={styles.photoGrid}>
        {pairPhotos.map((photo, idx) => (
          <PhotoContainer 
            key={photo.id || idx}
            photo={photo} 
            customSize={IDENTIFICATION_PHOTO_SIZES.pairSmall}
          />
        ))}
      </View>
    </View>
  );
};

/**
 * Grid Photo Layout - 2x2 grid for subsequent pages
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

      {/* Photos with intelligent layout (same as LoadSectionPDF) */}
      {layout ? (
        layout.pages.map((photoIndices, pageIndex) => {
          const isFirstPage = pageIndex === 0;
          const pagePhotos = photoIndices.map(idx => validPhotos[idx]);
          
          // Determine layout type for this page
          let pageLayout = layout.type;
          if (layout.type === 'multiple' && !isFirstPage) {
            pageLayout = 'grid';
          }
          
          return (
            <View 
              key={`identification-page-${pageIndex}`} 
              style={styles.section}
              break={pageIndex > 0}
            >
              {pageIndex > 0 && (
                <SectionTitle 
                  sectionType={SECTION_TYPE} 
                  continuation
                >
                  PART IDENTIFICATION
                </SectionTitle>
              )}
              
              {/* Single photo - full page */}
              {pageLayout === 'single' && (
                <SinglePhotoLayout photo={pagePhotos[0]} />
              )}

              {/* Double photos - stacked vertically */}
              {pageLayout === 'double' && (
                <DoublePhotoLayout photos={pagePhotos} />
              )}

              {/* Triple or Multiple first page - hero + pair */}
              {(pageLayout === 'triple' || (pageLayout === 'multiple' && isFirstPage)) && (
                <TriplePhotoLayout photos={pagePhotos} />
              )}

              {/* Grid layout for subsequent pages */}
              {pageLayout === 'grid' && (
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
