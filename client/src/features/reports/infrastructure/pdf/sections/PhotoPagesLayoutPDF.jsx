/**
 * SHARED: Photo pages layout for PDF sections.
 * Handles the common page-splitting and rendering logic:
 * - Default : Page 1 = Hero (555×350) + up to 2 small photos (272×225) side by side, Page 2+ = Grid 2×2
 * - gridFromStart : All pages use Grid 2×2 (4 photos per page, each ~260px tall)
 *
 * Props:
 *   title         {string}       Section title displayed in the dark header bar
 *   photos        {array}        Already-validated photo objects
 *   headerExtra   {ReactElement} Optional extra content rendered inside the header (e.g. weight info)
 *   emptyContent  {ReactElement} Rendered on the first page when photos is empty (pass null to hide section entirely)
 *   gridFromStart {boolean}      When true, skip hero layout and use 2×2 grid from page 1
 */

import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PhotoContainer } from '../primitives';
import { validatePhotos } from '../helpers/photoHelpers';

const BRAND_DARK = '#1e293b';
const TEXT_GRAY  = '#64748b';

const styles = StyleSheet.create({
  sectionContainer: {
    flex: 1,
    marginBottom: 4,
    fontFamily: 'Helvetica',
  },
  sectionHeader: {
    backgroundColor: BRAND_DARK,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
    minHeight: 30,
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

export const PhotoPagesLayoutPDF = ({
  title,
  photos = [],
  headerExtra = null,
  emptyContent = null,
  gridFromStart = false,
}) => {
  const validPhotos = validatePhotos(photos);

  // Return nothing when no photos and no fallback content requested
  if (validPhotos.length === 0 && emptyContent === null) return null;

  // Build page descriptors
  const layoutPages = [];

  if (validPhotos.length > 0) {
    const GRID_SIZE = 4;

    if (gridFromStart) {
      let start = 0;
      while (start < validPhotos.length) {
        layoutPages.push({ type: 'grid', photos: validPhotos.slice(start, start + GRID_SIZE) });
        start += GRID_SIZE;
      }
    } else {
      const page1Photos = [validPhotos[0]];
      let remainingStart = 1;

      if (validPhotos.length >= 3) {
        page1Photos.push(validPhotos[1], validPhotos[2]);
        remainingStart = 3;
      } else if (validPhotos.length === 2) {
        page1Photos.push(validPhotos[1]);
        remainingStart = 2;
      }

      layoutPages.push({ type: 'initial', photos: page1Photos });

      while (remainingStart < validPhotos.length) {
        layoutPages.push({ type: 'grid', photos: validPhotos.slice(remainingStart, remainingStart + GRID_SIZE) });
        remainingStart += GRID_SIZE;
      }
    }
  } else {
    layoutPages.push({ type: 'empty', photos: [] });
  }

  const totalPages = layoutPages.length;

  return (
    <>
      {layoutPages.map((page, index) => (
        <View key={index} style={styles.sectionContainer} break={index > 0}>

          {/* Header */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>{title}</Text>
              {headerExtra}
            </View>
            <Text style={styles.sectionPagination}>{index + 1} / {totalPages}</Text>
          </View>

          {/* Initial layout: hero + 2 small */}
          {page.type === 'initial' && (
            <View style={{ flex: 1 }}>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <View wrap={false} style={{ width: '100%', alignItems: 'center' }}>
                  <PhotoContainer
                    photo={page.photos[0]}
                    customSize={{ width: 555, height: 350 }}
                    fit="contain"
                  />
                </View>
                {page.photos.length > 1 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, width: '100%' }} wrap={false}>
                    {page.photos.slice(1).map((p, i) => (
                      <View key={i} style={{ alignItems: 'center' }}>
                        <PhotoContainer
                          photo={p}
                          customSize={{ width: 272, height: 225 }}
                          fit="contain"
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Grid layout: 2×2 */}
          {page.type === 'grid' && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'flex-start' }}>
              {page.photos.map((p, i) => (
                <View key={i} wrap={false} style={{ width: '49%', marginBottom: 8 }}>
                  <PhotoContainer
                    photo={p}
                    customSize={{ width: '100%', height: 260 }}
                    fit="contain"
                  />
                </View>
              ))}
            </View>
          )}

          {/* Empty fallback */}
          {page.type === 'empty' && emptyContent && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              {emptyContent}
            </View>
          )}

        </View>
      ))}
    </>
  );
};
