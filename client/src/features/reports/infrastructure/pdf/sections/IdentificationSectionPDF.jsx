/**
 * INFRASTRUCTURE: Part Identification Section for PDF
 * Displays part identification, specifications, and photos with optimized layout
 * 
 * New Design:
 * - 3-Column Data Layout (Customer Data, Dimensions, Weight)
 * - Compact Technical Specs
 * - Hero Photo + 2 small photos (if space allows) on first page
 * - Section Header with pagination
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PhotoContainer, EmptyState } from '../primitives';
import { validatePhotos } from '../helpers/photoHelpers';

// Dark Blue brand color for headers
const BRAND_DARK = '#1e293b';
const BRAND_RED = '#ef4444';
const TEXT_DARK = '#1a1a1a';
const TEXT_GRAY = '#64748b';

const styles = StyleSheet.create({
  // Main Section Container
  sectionContainer: {
    marginBottom: 10,
    fontFamily: 'Helvetica',
  },
  gridPage: {
    minHeight: 500, // Ensure height for flex content on grid pages
  },

  // Section Header (Dark Blue Bar)
  sectionHeader: {
    backgroundColor: BRAND_DARK,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 2, // Reduced vertical padding
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  sectionPagination: {
    color: '#cbd5e1', // Light gray 
    fontSize: 10,
    fontFamily: 'Helvetica',
  },

  // 3-Column Data Layout
  dataGrid: {
    flexDirection: 'row',
    marginBottom: 4,
    // borderBottomWidth: 1, // Removed
    // borderBottomColor: BRAND_DARK, // Removed
    paddingBottom: 4,
  },

  // Columns
  colCustomerData: {
    width: '40%',
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  colDimensions: {
    width: '35%', // Reduced width
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  colWeight: {
    width: '25%', // Increased width slightly
    paddingLeft: 10,
  },

  // Column Header
  colHeaderLabel: {
    backgroundColor: '#0f4c81', // Blue accent for sub-headers
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 6,
    borderRadius: 2,
    alignSelf: 'flex-start', // Fit content width
  },

  // Data Rows
  row: {
    flexDirection: 'row',
    marginBottom: 3,
    alignItems: 'baseline',
  },
  label: {
    fontFamily: 'Helvetica-Bold', // Bold for visibility
    fontSize: 8, // Smaller font
    color: TEXT_GRAY,
    width: '50%',
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: TEXT_DARK,
    width: '50%',
  },

  // Dimensions List
  dimList: {
    flexDirection: 'column',
  },
  dimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  dimLabel: {
    fontSize: 9,
    color: TEXT_DARK,
  },
  dimValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_DARK,
  },

  // Weight Large
  weightValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: TEXT_DARK,
    marginTop: 5,
  },

  // Technical Specs Block
  specsContainer: {
    marginTop: 2,
    marginBottom: 2,
  },
  specsTitle: {
    backgroundColor: BRAND_DARK,
    color: '#ffffff',
    fontSize: 12,

    fontFamily: 'Helvetica-Bold',
    paddingVertical: 4,
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  specsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  specItem: {
    fontSize: 10,
    color: TEXT_DARK,
    maxWidth: '48%',
  },

  // Photos Section
  // Photos Section
  photosHeader: {
    backgroundColor: BRAND_DARK,
    paddingVertical: 4,
    paddingHorizontal: 15,
    marginBottom: 10, // Reduced from 30
    marginTop: 5,
  },
  photosTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },

  // Photo Layouts
  heroLayout: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  heroRowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },

  gridLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 15,
  },
  descriptionBox: {
    borderWidth: 1,
    borderColor: BRAND_DARK,
    padding: 5,
    marginTop: 2,
    marginBottom: 5,
  }
});

// Photo Sizes
const SIZES = {
  heroLarge: { width: 340, height: 190 }, // Reduced from 380 to ensure fit
  heroSmall: { width: 165, height: 110 }, // Reduced proportional
  gridItem: { width: 220, height: 140 },  // Reduced from 240x160 to fit 6 per page
};

/**
 * Helper to resolve units (handles strings vs object relations)
 */
const resolveUnit = (directUnit, relationUnit) => {
  if (directUnit && typeof directUnit === 'string') return directUnit;
  if (relationUnit && typeof relationUnit === 'object' && relationUnit.name) return relationUnit.name;
  if (relationUnit && typeof relationUnit === 'string') return relationUnit;
  return '';
};



/**
 * Component: Part Identification Section for PDF
 */
export const IdentificationSectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  const validPhotos = validatePhotos(photos || []);
  const partData = report.partData || report.part || {};

  // Data Extraction
  const steelGrade = partData.steel?.grade || partData.steelGrade || 'Not specified';

  // Dimensions extraction
  const length = partData.dim_rect_length;
  const width = partData.dim_rect_width;
  const height = partData.dim_rect_height || partData.dim_circ_height; // Fallback
  const diameterOut = partData.dim_circ_diameterOut;
  const diameterIn = partData.dim_circ_diameterIn;
  const unitRect = resolveUnit(partData.dim_rect_unit, partData.rectUnit);
  const unitCirc = resolveUnit(partData.dim_circ_unit, partData.circUnit);

  // Weight
  const weight = partData.dim_weight_value;
  const unitWeight = resolveUnit(partData.dim_weight_unit, partData.weightUnit);

  // Specs
  // const activeSpecs = formatSpecs(partData.hardnessSpecs, partData.ecdSpecs);

  // --- Layout Logic ---
  // Page 1 available space logic:
  // We have Headers + Data + Specs roughly taking 1/3 to 1/2 page.
  // We can fit 1 Large Hero photo comfortably.
  // If we have >= 3 photos, we can try 1 Large + 2 Small on Page 1 (if strict space allows, but usually safer to do just 1 Hero).
  // Strategy:
  // Page 1: Data + Specs + Photo #1 (Hero) + (Optional Photo #2 & #3 if they exist)
  // Page 2+: Remaining photos in Grid 2x3

  // Let's go with: Page 1 = Data + Specs + Up to 3 photos (1 Big, 2 Small below).

  const layoutPages = [];

  if (validPhotos.length > 0) {
    // Page 1 Photos
    const page1Photos = [];
    let remainingStartIndex = 0;

    // Add first photo (Hero)
    page1Photos.push({ ...validPhotos[0], size: SIZES.heroLarge });
    remainingStartIndex = 1;

    // If we have at least 2 more, add them as small row
    if (validPhotos.length >= 3) {
      page1Photos.push({ ...validPhotos[1], size: SIZES.heroSmall });
      page1Photos.push({ ...validPhotos[2], size: SIZES.heroSmall });
      remainingStartIndex = 3;
    } else if (validPhotos.length === 2) {
      // Just 2 photos total? Maybe put 2nd one large too? Or side by side?
      // Let's stick to simple: 2nd photo is small or just pushed to next page?
      // Let's put 2nd photo as small to be safe
      page1Photos.push({ ...validPhotos[1], size: SIZES.heroSmall });
      remainingStartIndex = 2;
    }

    layoutPages.push({ type: 'initial', photos: page1Photos });

    // Subsequent Pages (Grid 2x3 = 6 photos max)
    const GRID_SIZE = 4;
    while (remainingStartIndex < validPhotos.length) {
      const chunk = validPhotos.slice(remainingStartIndex, remainingStartIndex + GRID_SIZE);
      layoutPages.push({ type: 'grid', photos: chunk });
      remainingStartIndex += GRID_SIZE;
    }
  } else {
    // No photos, still need 1 page for data
    layoutPages.push({ type: 'initial_no_photos', photos: [] });
  }

  const totalPages = layoutPages.length;

  return (
    <>
      {layoutPages.map((page, index) => {
        const isFirstPage = index === 0;
        const pageNum = index + 1;

        return (
          // Use 'minPresenceAhead' or wrap logic delicately. 
          // To prevent "Header on P2, Content on P3", we wrap the Header AND Content together in a View with wrap={false} IF it's likely to fit. 
          // But a whole page won't fit. 
          // Better strategy: The Header is small. If we keep 'break' logic, content follows.
          // Is the Grid getting pushed?? 
          // Let's remove 'wrap={false}' from gridLayout strictly.
          <View key={index} style={[styles.sectionContainer, page.type === 'grid' && styles.gridPage]} break={!isFirstPage}>

            {/* Wrap Header and Content in a View that *allows* breaking internally but tries to keep header with start of content */}

            {/* --- Section Header --- */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PART IDENTIFICATION</Text>
              <Text style={styles.sectionPagination}>{pageNum} / {totalPages}</Text>
            </View>

            {/* --- Page 1 Content (Data & Specs) --- */}
            {isFirstPage && (
              <>
                <View style={styles.dataGrid}>
                  {/* ... Cols ... */}
                  <View style={styles.colCustomerData}>
                    <Text style={styles.colHeaderLabel}>CUSTOMER DATA</Text>
                    <View style={styles.row}>
                      <Text style={styles.label}>CLIENT DESIGNATION:</Text>
                      <Text style={styles.value}>{partData.client_designation || '-'}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>DESIGNATION:</Text>
                      <Text style={styles.value}>{partData.designation || partData.name || '-'}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>REFERENCE:</Text>
                      <Text style={styles.value}>{partData.reference || '-'}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>QUANTITY:</Text>
                      <Text style={styles.value}>{partData.quantity || '-'}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.label}>STEEL GRADE:</Text>
                      <Text style={styles.value}>{steelGrade}</Text>
                    </View>
                  </View>

                  <View style={styles.colDimensions}>
                    <Text style={styles.colHeaderLabel}>DIMENSIONS</Text>
                    <View style={styles.dimList}>
                      {length && <View style={styles.dimRow}><Text style={styles.dimLabel}>Length :</Text><Text style={styles.dimValue}>{length} {unitRect}</Text></View>}
                      {width && <View style={styles.dimRow}><Text style={styles.dimLabel}>Width :</Text><Text style={styles.dimValue}>{width} {unitRect}</Text></View>}
                      {diameterOut && <View style={styles.dimRow}><Text style={styles.dimLabel}>{diameterIn ? 'Ext. Diameter' : 'Diameter'} :</Text><Text style={styles.dimValue}>{diameterOut} {unitCirc}</Text></View>}
                      {diameterIn && <View style={styles.dimRow}><Text style={styles.dimLabel}>{diameterOut ? 'Int. Diameter' : 'Diameter'} :</Text><Text style={styles.dimValue}>{diameterIn} {unitCirc}</Text></View>}
                      {height && <View style={styles.dimRow}><Text style={styles.dimLabel}>Height :</Text><Text style={styles.dimValue}>{height} {unitRect}</Text></View>}
                    </View>
                  </View>

                  <View style={styles.colWeight}>
                    <Text style={styles.colHeaderLabel}>WEIGHT</Text>
                    <Text style={styles.weightValue}>
                      {weight ? `${weight} ${unitWeight}` : '-'}
                    </Text>
                  </View>
                </View>

                {/* Part Description Box */}
                <View style={{ marginBottom: 4 }}>
                  <Text style={{ ...styles.label, width: '100%', marginBottom: 2 }}>PART DESCRIPTION:</Text>
                  <View style={styles.descriptionBox}>
                    <Text style={{ ...styles.value, width: '100%', fontSize: 8 }}>
                      {report.partDescription || '-'}
                    </Text>
                  </View>
                </View>

                {(partData.hardnessSpecs?.length > 0 || partData.ecdSpecs?.length > 0) && (
                  <View style={styles.specsContainer}>
                    <Text style={styles.specsTitle}>TECHNICAL SPECIFICATIONS</Text>
                    <View style={styles.specsContent}>
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
                            {partData.hardnessSpecs?.length > 0 && (
                              <View style={{ width: '48%' }}>
                                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 2, color: TEXT_DARK }}>Hardness:</Text>
                                {partData.hardnessSpecs.map((h, i) => (
                                  <View key={`h-${i}`} style={styles.row}>
                                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: TEXT_GRAY, marginRight: 4 }}>{h.name || 'Hardness'}:</Text>
                                    <Text style={{ fontSize: 9, color: TEXT_DARK }}>{formatSpecValue(h.min, h.max, h.unit || '')}</Text>
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* ECD Column */}
                            {partData.ecdSpecs?.length > 0 && (
                              <View style={{ width: '48%' }}>
                                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 10, marginBottom: 2, color: TEXT_DARK }}>ECD:</Text>
                                {partData.ecdSpecs.map((e, i) => (
                                  <View key={`e-${i}`} style={styles.row}>
                                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, color: TEXT_GRAY, marginRight: 4 }}>{e.name || 'ECD'}:</Text>
                                    <Text style={{ fontSize: 9, color: TEXT_DARK }}>{formatSpecValue(e.depthMin, e.depthMax, e.depthUnit || 'mm')}{e.hardness ? ` @ ${e.hardness} ${e.hardnessUnit || ''}` : ''}</Text>
                                  </View>
                                ))}
                              </View>
                            )}
                          </>
                        )
                      })()}
                    </View>
                  </View>
                )}
              </>
            )}

            {/* --- Photos --- */}
            {/* --- Photos --- */}
            {page.photos.length > 0 && (
              <>
                {isFirstPage && (
                  <View style={styles.photosHeader}>
                    <Text style={styles.photosTitle}>PICTURES</Text>
                  </View>
                )}

                <View style={{ flex: 1 }}> {/* Flex 1 to fill remaining space */}

                  {/* Layout: Initial (Adaptive Flex) */}
                  {page.type === 'initial' && (
                    <View style={{ flex: 1, flexDirection: 'column', gap: 10 }}>
                      {/* Hero Photo - Takes more space */}
                      {page.photos[0] && (
                        <View style={{ flex: 6, minHeight: 180 }}> {/* Flex 6 (~55%) */}
                          <PhotoContainer
                            photo={page.photos[0]}
                            style={{ width: '100%', height: '100%' }}
                            customSize={{ width: '100%', height: '92%' }}
                            fit="contain"
                          />
                        </View>
                      )}

                      {/* Secondary Row - Takes less space */}
                      {page.photos.length > 1 && (
                        <View style={{ flex: 5, flexDirection: 'row', gap: 10, minHeight: 150 }}> {/* Flex 5 (~45%) */}
                          {page.photos.slice(1).map((p, i) => (
                            <View key={i} style={{ flex: 1 }}>
                              <PhotoContainer
                                photo={p}
                                style={{ width: '100%', height: '100%' }}
                                customSize={{ width: '100%', height: '85%' }}
                                fit="contain"
                              />
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Layout: Grid (Optimized 4 items Max) */}
                  {page.type === 'grid' && (
                    <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'flex-start' }}>
                      {page.photos.map((p, i) => (
                        <View key={i} style={{ width: '49%', height: '49%', marginBottom: '1%' }}>
                          <PhotoContainer
                            photo={p}
                            style={{ width: '100%', height: '100%' }}
                            customSize={{ width: '100%', height: '94%' }} // Maximize photo area
                            fit="contain" // Keep contain to avoid crop, but space is maximized
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        );
      })}
    </>
  );
};

export default IdentificationSectionPDF;
