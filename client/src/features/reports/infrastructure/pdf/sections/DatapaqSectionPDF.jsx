import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { validatePhotos } from '../helpers/photoHelpers';
import { VerticalPhotosLayout, GridPhotosLayout } from '../layouts';

// Brand Colors
const BRAND_DARK = '#1e293b';

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 0,
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
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12, // Consistent with Curves
    textTransform: 'uppercase',
  },
  sectionPagination: {
    color: '#cbd5e1',
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  pageContent: {
    width: '100%',
  }
});

/**
 * Datapaq Section for PDF
 * 
 * Layout Strategy:
 * - Page 1: Vertical Stack (Max 2 photos) - Uses VerticalPhotosLayout
 * - Page 2+: Grid 2x3 (Max 6 photos) - Uses GridPhotosLayout
 */
export const DatapaqSectionPDF = ({ report, photos = [] }) => {
  // Validate photos (ALWAYS CALL HOOKS AT TOP LEVEL)
  const validPhotos = useMemo(() => validatePhotos(photos || []), [photos]);

  // Calculate Pages (ALWAYS CALL HOOKS AT TOP LEVEL)
  const pages = useMemo(() => {
    if (validPhotos.length === 0) return [];

    const _pages = [];

    // --- Page 1: Vertical Stack (Max 2 photos) ---
    // Take first 2 photos for the first page
    const page1Photos = validPhotos.slice(0, 2);
    if (page1Photos.length > 0) {
      _pages.push({
        type: 'vertical',
        photos: page1Photos
      });
    }

    // --- Page 2+: Grid (Max 6 photos per page) ---
    // Remaining photos start from index 2
    const remainingPhotos = validPhotos.slice(2);
    const GRID_SIZE = 6;
    let gridCursor = 0;

    // If there are remaining photos, chunk them into pages
    while (gridCursor < remainingPhotos.length) {
      const chunk = remainingPhotos.slice(gridCursor, gridCursor + GRID_SIZE);
      _pages.push({
        type: 'grid',
        photos: chunk
      });
      gridCursor += GRID_SIZE;
    }

    return _pages;
  }, [validPhotos]);

  if (!report) return null;
  if (validPhotos.length === 0) return null;

  const totalPages = pages.length;

  return (
    <>
      {pages.map((page, index) => {
        const isFirstPage = index === 0;
        const pageNum = index + 1;

        return (
          <View key={index} style={styles.sectionContainer} break={!isFirstPage}>
            {/* Section Header (Repeated on every page) */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>DATAPAQ REPORTS</Text>
              <Text style={styles.sectionPagination}>{pageNum} / {totalPages}</Text>
            </View>

            {/* Page Content based on Layout Type */}
            <View style={styles.pageContent}>
              {page.type === 'vertical' && (
                <VerticalPhotosLayout photos={page.photos} />
              )}
              {page.type === 'grid' && (
                <GridPhotosLayout photos={page.photos} />
              )}
            </View>
          </View>
        );
      })}
    </>
  );
};

export default DatapaqSectionPDF;
