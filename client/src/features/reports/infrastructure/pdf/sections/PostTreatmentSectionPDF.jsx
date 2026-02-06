/**
 * INFRASTRUCTURE: Post-treatment Section for PDF
 * Displays post-treatment photos with intelligent layout
 *
 * Layout Strategy (identical to Load Design):
 * - Page 1: Hero (Large) + 2 Small Photos (Adaptive Flex)
 * - Page 2+: Grid 2x2 (4 photos max per page)
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { SPACING, COLORS } from '../theme';
import { PhotoContainer } from '../primitives';
import { validatePhotos } from '../helpers/photoHelpers';

const BRAND_DARK = '#1e293b';

// Styles matching LoadSectionPDF
const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 20,
    fontFamily: 'Helvetica',
    minHeight: 500, // Ensure minimum height for flex expansion
  },
  // Section Header (Dark Blue Bar)
  sectionHeader: {
    backgroundColor: BRAND_DARK,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12, // Consistent padding
    marginBottom: 30, // Consistent spacing
    minHeight: 40,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flex: 1,
  },
  sectionTitle: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  sectionPagination: {
    color: '#cbd5e1',
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
});

export const PostTreatmentSectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  // Validate and process photos
  const validPhotos = validatePhotos(photos || []);

  if (validPhotos.length === 0) {
    return null;
  }

  // --- Layout Logic (Mirrors LoadSectionPDF) ---
  const layoutPages = [];

  if (validPhotos.length > 0) {
    // Page 1 Photos
    const page1Photos = [];
    let remainingStartIndex = 0;

    // Add first photo (Hero)
    page1Photos.push(validPhotos[0]);
    remainingStartIndex = 1;

    // We can fit 2 more small photos below the large Hero on Page 1
    if (validPhotos.length >= 3) {
      page1Photos.push(validPhotos[1]);
      page1Photos.push(validPhotos[2]);
      remainingStartIndex = 3;
    } else if (validPhotos.length === 2) {
      page1Photos.push(validPhotos[1]);
      remainingStartIndex = 2;
    }

    layoutPages.push({ type: 'initial', photos: page1Photos });

    // Subsequent Pages (Grid 2x2 = 4 photos max)
    const GRID_SIZE = 4;
    while (remainingStartIndex < validPhotos.length) {
      const chunk = validPhotos.slice(remainingStartIndex, remainingStartIndex + GRID_SIZE);
      layoutPages.push({ type: 'grid', photos: chunk });
      remainingStartIndex += GRID_SIZE;
    }
  }

  const totalPages = layoutPages.length;

  return (
    <>
      {layoutPages.map((page, index) => {
        const isFirstPage = index === 0;
        const pageNum = index + 1;

        return (
          <View key={index} style={styles.sectionContainer} break={!isFirstPage}>

            {/* --- Section Header --- */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>POST-TRAITEMENT</Text>
              </View>
              <Text style={styles.sectionPagination}>{pageNum} / {totalPages}</Text>
            </View>

            {/* --- Photos --- */}
            {page.photos.length > 0 && (
              <View style={{ flex: 1, minHeight: 400 }}> {/* Flex 1 to fill space */}

                {/* Layout: Initial (Hero + optional Small) */}
                {page.type === 'initial' && (
                  <View style={{ flex: 1, gap: 10 }}>
                    {/* Hero Photo (Flex 3 = ~60%) */}
                    {page.photos[0] && (
                      <View style={{ flex: 3 }}>
                        <PhotoContainer
                          photo={page.photos[0]}
                          style={{ width: '100%', height: '100%' }}
                          customSize={{ width: '100%', height: '92%' }}
                          fit="contain"
                        />
                      </View>
                    )}

                    {/* Small Photos Row (Flex 2 = ~40%) */}
                    {page.photos.length > 1 && (
                      <View style={{ flex: 2, flexDirection: 'row', gap: 10 }}>
                        {page.photos.slice(1).map((p, i) => (
                          <View key={i} style={{ flex: 1 }}>
                            <PhotoContainer
                              photo={p}
                              style={{ width: '100%', height: '100%' }}
                              customSize={{ width: '100%', height: '90%' }}
                              fit="contain"
                            />
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Layout: Grid (Optimized 4 items Max - 49% Width/Height) */}
                {page.type === 'grid' && (
                  <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'flex-start' }}>
                    {page.photos.map((p, i) => (
                      <View key={i} style={{ width: '49%', height: '49%', marginBottom: '1%' }}>
                        <PhotoContainer
                          photo={p}
                          style={{ width: '100%', height: '100%' }}
                          customSize={{ width: '100%', height: '94%' }} // Maximize photo area
                          fit="contain"
                        />
                      </View>
                    ))}
                  </View>
                )}

              </View>
            )}

          </View>
        );
      })}
    </>
  );
};

export default PostTreatmentSectionPDF;
