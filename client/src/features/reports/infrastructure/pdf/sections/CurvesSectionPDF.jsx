/**
 * INFRASTRUCTURE: Section Courbes pour le PDF
 * Affiche les courbes de température et rapports de four avec layout intelligent
 * Photos adaptatives : hauteur calculée par page pour utiliser tout l'espace disponible
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { PhotoContainer } from '../primitives';

const BRAND_DARK = '#1e293b';

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 0,
    fontFamily: 'Helvetica',
  },
  sectionHeader: {
    backgroundColor: BRAND_DARK,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 4,
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
  subCategoryTitle: {
    backgroundColor: '#3b82f6',
    padding: 3,
    paddingHorizontal: 6,
    marginBottom: 4,
    alignSelf: 'flex-start',
    borderRadius: 2,
  },
  subCategoryText: {
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
  },
  pageContent: {
    flexDirection: 'column',
    gap: 4,
  },
  photoWrapper: {
    width: '100%',
    alignItems: 'center',
  },
});

// --- Hauteur adaptive par page ---
// Hauteur de contenu disponible estimée par page (après header/footer du document)
const AVAILABLE_H = 640;
const SECTION_HEADER_H = 30; // Barre sombre + marginBottom
const CAT_HEADER_H = 24;     // Pastille bleue + marginBottom
const CAPTION_H = 12;        // Légende sous la photo
const PHOTO_GAP_H = 4;       // Écart entre photos (gap du pageContent)
const PHOTO_WIDTH = 565;     // Pleine largeur page (A4 - paddingHorizontal)
const MAX_H_SINGLE = 520;    // Plafond pour 1 photo seule
const MAX_H_DOUBLE = 310;    // Plafond pour 2 photos

/**
 * Calcule la hauteur optimale de chaque photo selon le nombre de photos
 * et d'en-têtes de catégorie sur la page.
 */
const computePhotoHeight = (photoCount, catHeaderCount) => {
  if (photoCount === 0) return 200;
  const headersH = SECTION_HEADER_H + catHeaderCount * CAT_HEADER_H;
  const overheadH = photoCount * CAPTION_H + Math.max(0, photoCount - 1) * PHOTO_GAP_H;
  const availableForPhotos = AVAILABLE_H - headersH - overheadH;
  const rawH = Math.floor(availableForPhotos / photoCount);
  const maxH = photoCount === 1 ? MAX_H_SINGLE : MAX_H_DOUBLE;
  return Math.min(rawH, maxH);
};

/**
 * Organise les photos par catégorie (heating, cooling, tempering, alarms, datapaq, other)
 */
const organizePhotosByCategory = (photos) => {
  const categories = {
    heating:  { name: 'Heating Curves',     photos: [] },
    cooling:  { name: 'Cooling Curves',      photos: [] },
    tempering:{ name: 'Tempering Curves',    photos: [] },
    alarms:   { name: 'Alarms and Events',   photos: [] },
    datapaq:  { name: 'Datapaq Reports',     photos: [] },
    other:    { name: 'Other Curves',        photos: [] },
  };

  let allPhotos = [];
  if (Array.isArray(photos)) {
    allPhotos = photos;
  } else if (typeof photos === 'object' && photos) {
    Object.values(photos).forEach(cat => {
      if (Array.isArray(cat)) allPhotos.push(...cat);
    });
  }

  allPhotos.forEach(photo => {
    const sub  = (photo.subcategory || '').toLowerCase();
    const name = (photo.name || photo.original_name || '').toLowerCase();
    let target = 'other';
    if      (sub === 'heating'   || sub === 'chauffage')       target = 'heating';
    else if (sub === 'cooling'   || sub === 'refroidissement')  target = 'cooling';
    else if (sub === 'tempering' || sub === 'revenu')           target = 'tempering';
    else if (sub === 'alarms'    || sub === 'alarmes')          target = 'alarms';
    else if (sub === 'datapaq')                                 target = 'datapaq';
    else if (name.includes('heating')  || name.includes('chauff'))   target = 'heating';
    else if (name.includes('cooling')  || name.includes('refroid'))   target = 'cooling';
    else if (name.includes('tempering')|| name.includes('revenu'))    target = 'tempering';
    else if (name.includes('alarm'))                                   target = 'alarms';
    else if (name.includes('datapaq'))                                 target = 'datapaq';
    categories[target].photos.push(photo);
  });

  return categories;
};

/**
 * Composant principal : Section Courbes
 */
export const CurvesSectionPDF = ({ report, photos = [] }) => {
  // 1. Aplatir les items (headers + photos) dans l'ordre des catégories
  const layoutItems = useMemo(() => {
    const organized = organizePhotosByCategory(photos);
    const categoryOrder = ['heating', 'cooling', 'tempering', 'alarms', 'datapaq', 'other'];
    const items = [];
    categoryOrder.forEach(catKey => {
      const cat = organized[catKey];
      if (cat.photos.length > 0) {
        items.push({ type: 'header', text: cat.name });
        cat.photos.forEach(p => items.push({ type: 'photo', data: p }));
      }
    });
    return items;
  }, [photos]);

  // 2. Paginer : max 2 photos par page
  const pages = useMemo(() => {
    const _pages = [];
    let current = { items: [], photoCount: 0 };
    layoutItems.forEach(item => {
      if (item.type === 'photo' && current.photoCount >= 2) {
        _pages.push(current);
        current = { items: [], photoCount: 0 };
      }
      current.items.push(item);
      if (item.type === 'photo') current.photoCount++;
    });
    if (current.items.length > 0) _pages.push(current);
    return _pages;
  }, [layoutItems]);

  if (!report || layoutItems.length === 0) return null;

  const totalPages = pages.length;

  return (
    <>
      {pages.map((page, pageIdx) => {
        const catCount = page.items.filter(i => i.type === 'header').length;
        const photoH  = computePhotoHeight(page.photoCount, catCount);

        return (
          <View key={pageIdx} style={styles.sectionContainer} break={pageIdx > 0}>
            {/* En-tête répété sur chaque page */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>FURNACE CURVES AND REPORTS</Text>
              <Text style={styles.sectionPagination}>{pageIdx + 1} / {totalPages}</Text>
            </View>

            {/* Contenu */}
            <View style={styles.pageContent}>
              {page.items.map((item, itemIdx) => {
                if (item.type === 'header') {
                  return (
                    <View key={`h-${itemIdx}`} style={styles.subCategoryTitle}>
                      <Text style={styles.subCategoryText}>{item.text}</Text>
                    </View>
                  );
                }
                if (item.type === 'photo') {
                  return (
                    <View key={`p-${itemIdx}`} style={styles.photoWrapper} wrap={false}>
                      <PhotoContainer
                        photo={item.data}
                        customSize={{ width: PHOTO_WIDTH, height: photoH }}
                        showCaption={true}
                      />
                    </View>
                  );
                }
                return null;
              })}
            </View>
          </View>
        );
      })}
    </>
  );
};

export default CurvesSectionPDF;
