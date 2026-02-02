/**
 * INFRASTRUCTURE: Load Configuration Section for PDF
 * Displays load photos and weight information
 * 
 * Design:
 * - Section Header with Weight Info & Pagination
 * - Page 1: Hero Photo (Large) + 2 Small photos (if space allows)
 * - Page 2+: Grid 2x3
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PhotoContainer } from '../primitives';
import { validatePhotos } from '../helpers/photoHelpers';

// Brand Colors
const BRAND_DARK = '#1e293b';
const BRAND_RED = '#ef4444';
const TEXT_DARK = '#1a1a1a';
const TEXT_GRAY = '#64748b';

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 20,
    fontFamily: 'Helvetica',
  },

  // Section Header (Dark Blue Bar)
  sectionHeader: {
    backgroundColor: BRAND_DARK,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    marginBottom: 15,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  loadInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  loadLabel: {
    color: '#cbd5e1',
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  loadValue: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  sectionPagination: {
    color: '#cbd5e1',
    fontSize: 10,
    fontFamily: 'Helvetica',
  },

  // Photos Section
  photosTitle: {
    backgroundColor: BRAND_DARK,
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    paddingVertical: 4,
    paddingHorizontal: 15,
    marginBottom: 10,
  },

  // Photo Layouts
  heroLayout: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 15, // Increased gap for Hero page
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
  }
});

// Photo Sizes - Optimized for Load Section (No Data Grid)
const SIZES = {
  // Hero can be larger as there is no data grid above it
  heroLarge: { width: 450, height: 280 },
  heroSmall: { width: 220, height: 140 }, // Match grid item size for consistency
  gridItem: { width: 220, height: 140 }, // Standard Grid Size (6 per page)
};

/**
 * Component: Load Configuration Section for PDF
 */
export const LoadSectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  const validPhotos = validatePhotos(photos || []);
  const trialData = report.trialData || {};

  // Extract Load Weight Info
  const loadWeight = trialData.load_weight_value;
  const loadWeightUnit = trialData.weightUnit?.name || trialData.load_weight_unit || 'kg';

  // --- Layout Logic ---
  // Page 1: Hero (Large) + 2 Small (if available) -> No Data Grid, so we have plenty of space.
  // Page 2+: Grid 2x3

  const layoutPages = [];

  if (validPhotos.length > 0) {
    // Page 1 Photos
    const page1Photos = [];
    let remainingStartIndex = 0;

    // Add first photo (Hero)
    page1Photos.push({ ...validPhotos[0], size: SIZES.heroLarge });
    remainingStartIndex = 1;

    // We can definitely fit 2 more small photos below the large Hero on Page 1
    if (validPhotos.length >= 3) {
      page1Photos.push({ ...validPhotos[1], size: SIZES.heroSmall });
      page1Photos.push({ ...validPhotos[2], size: SIZES.heroSmall });
      remainingStartIndex = 3;
    } else if (validPhotos.length === 2) {
      page1Photos.push({ ...validPhotos[1], size: SIZES.heroSmall });
      remainingStartIndex = 2;
    }

    layoutPages.push({ type: 'initial', photos: page1Photos });

    // Subsequent Pages (Grid 2x3 = 6 photos max)
    const GRID_SIZE = 6;
    while (remainingStartIndex < validPhotos.length) {
      const chunk = validPhotos.slice(remainingStartIndex, remainingStartIndex + GRID_SIZE);
      layoutPages.push({ type: 'grid', photos: chunk });
      remainingStartIndex += GRID_SIZE;
    }
  } else {
    // Even if no photos, show header with weight? Or skip?
    // Typically we show the section if it is active. 
    // User said "Etant donné qu'a par le poids... elle ne contient que des photos".
    // If no photos, maybe just 1 page with header.
    layoutPages.push({ type: 'initial_no_photos', photos: [] });
  }

  const totalPages = layoutPages.length;

  return (
    <>
      {layoutPages.map((page, index) => {
        const isFirstPage = index === 0;
        const pageNum = index + 1;

        return (
          <View key={index} style={styles.sectionContainer} break={!isFirstPage}>

            {/* Wrap Header and Content to prevent detachment */}

            {/* --- Section Header --- */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>LOAD CONFIGURATION</Text>
                {/* Load Weight Info in Header */}
                {(loadWeight) && (
                  <View style={styles.loadInfo}>
                    <Text style={styles.loadLabel}>WEIGHT:</Text>
                    <Text style={styles.loadValue}>{loadWeight} {loadWeightUnit}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.sectionPagination}>{pageNum} / {totalPages}</Text>
            </View>

            {/* --- Photos --- */}
            {page.photos.length > 0 && (
              <View>
                {/** Header Description? User said "le titre qui doit rester sur la meme page (description)" 
                      Maybe he means the photo description? 
                      PhotoContainer handles description. 
                 **/}

                {/* Layout: Initial (Hero + optional Small) */}
                {page.type === 'initial' && (
                  <View style={styles.heroLayout}>
                    {/* Hero Photo */}
                    {page.photos[0] && (
                      <View wrap={false}>
                        <PhotoContainer photo={page.photos[0]} customSize={page.photos[0].size} />
                      </View>
                    )}

                    {/* Small Photos Row (if any) */}
                    {page.photos.length > 1 && (
                      <View style={{ ...styles.heroRowSmall, width: SIZES.heroLarge.width }} wrap={false}>
                        {page.photos.slice(1).map((p, i) => (
                          <PhotoContainer key={i} photo={p} customSize={p.size} />
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Layout: Grid */}
                {page.type === 'grid' && (
                  <View style={styles.gridLayout}>
                    {page.photos.map((p, i) => (
                      <View key={i} wrap={false}>
                        <PhotoContainer photo={p} customSize={SIZES.gridItem} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {page.photos.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: TEXT_GRAY, fontSize: 10 }}>No photos available.</Text>
              </View>
            )}

          </View>
        );
      })}
    </>
  );
};

export default LoadSectionPDF;
