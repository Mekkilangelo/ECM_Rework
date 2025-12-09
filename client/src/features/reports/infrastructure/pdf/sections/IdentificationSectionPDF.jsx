/**
 * INFRASTRUCTURE: Part Identification Section for PDF
 * Displays part identification, specifications, and photos organized by view
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { getPhotoUrl, validatePhotos } from '../helpers/photoHelpers';

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: '#ffffff',
    backgroundColor: '#2c3e50',
    letterSpacing: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  subsectionTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginTop: 14,
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    color: '#2c3e50',
    backgroundColor: '#ecf0f1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
    paddingBottom: 6,
    borderBottom: '0.5pt solid #e8e8e8',
  },
  label: {
    fontSize: 9,
    fontWeight: 'bold',
    width: '30%',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  value: {
    fontSize: 9,
    width: '70%',
    color: '#1a1a1a',
  },
  specGrid: {
    marginTop: 6,
    marginBottom: 10,
  },
  specRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: '0.5pt solid #f0f0f0',
  },
  specLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    width: '28%',
    color: '#555',
  },
  specValue: {
    fontSize: 8.5,
    width: '72%',
    color: '#1a1a1a',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    justifyContent: 'flex-start',
    gap: 8,
  },
  photoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    justifyContent: 'space-between',
    gap: 8,
  },
  photoContainer: {
    marginBottom: 8,
    alignItems: 'center',
  },
  photoContainerSingle: {
    width: '100%',
    marginBottom: 8,
    alignItems: 'center',
  },
  photoContainerHalf: {
    width: '48%',
    marginBottom: 8,
    alignItems: 'center',
  },
  photo: {
    objectFit: 'cover',
    border: '0.5pt solid #d0d0d0',
  },
  photoFullWidth: {
    width: 480,
    height: 200,
  },
  photoHalfWidth: {
    width: 235,
    height: 176,
  },
  photoSmall: {
    width: 235,
    height: 140,
  },
  photoLabel: {
    fontSize: 7.5,
    textAlign: 'center',
    marginTop: 3,
    color: '#888',
    fontStyle: 'italic',
  },
  emptyState: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  pageBreak: {
    marginTop: 16,
  },
  viewTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#2c3e50',
    letterSpacing: 0.3,
  }
});

/**
 * Component: Part Identification Section for PDF
 */
export const IdentificationSectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  // Validate and process photos
  const validPhotos = validatePhotos(photos || []);
  
  // Extract data from report
  const partData = report.partData || report.part || {};
  const steelGrade = partData.steel?.grade || partData.steelGrade || 'Not specified';

  // Get specifications - check multiple locations
  const hardnessSpecs = partData.hardnessSpecs || [];
  const ecdSpecs = partData.ecdSpecs || [];

  // Format dimensions
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

  // Group photos by subcategory (view)
  const photosByView = {};
  validPhotos.forEach(photo => {
    const view = photo.subcategory || 'other';
    if (!photosByView[view]) {
      photosByView[view] = [];
    }
    photosByView[view].push(photo);
  });

  /**
   * Calcule le layout intelligent pour une page de photos
   * Optimise l'utilisation de l'espace disponible
   */
  const calculatePageLayout = (views) => {
    const layouts = [];
    const pageHeight = 700; // Hauteur disponible approximative
    let currentPage = { views: [], usedHeight: 0 };

    Object.entries(views).forEach(([viewName, photos]) => {
      const photoCount = photos.length;
      
      // Calculer la hauteur nécessaire pour cette vue
      let viewHeight = 80; // Header + marges
      
      if (photoCount === 1) {
        // 1 photo : pleine largeur mais hauteur réduite
        viewHeight += 220; // 200px photo + 20px label
      } else if (photoCount === 2) {
        // 2 photos : côte à côte
        viewHeight += 200; // 176px photo + labels
      } else if (photoCount <= 4) {
        // 3-4 photos : 2 lignes de 2
        viewHeight += 360; // 2 lignes
      } else if (photoCount <= 6) {
        // 5-6 photos : 3 lignes de 2
        viewHeight += 540; // 3 lignes
      } else {
        // Plus de 6 photos : nouvelle page dédiée
        viewHeight = pageHeight + 1; // Force nouvelle page
      }

      // Vérifier si on peut ajouter cette vue sur la page actuelle
      if (currentPage.usedHeight + viewHeight <= pageHeight && currentPage.views.length < 3) {
        currentPage.views.push({ viewName, photos, height: viewHeight });
        currentPage.usedHeight += viewHeight;
      } else {
        // Sauvegarder la page actuelle et en créer une nouvelle
        if (currentPage.views.length > 0) {
          layouts.push(currentPage);
        }
        currentPage = {
          views: [{ viewName, photos, height: viewHeight }],
          usedHeight: viewHeight
        };
      }
    });

    // Ajouter la dernière page
    if (currentPage.views.length > 0) {
      layouts.push(currentPage);
    }

    return layouts;
  };

  const pageLayouts = calculatePageLayout(photosByView);

  return (
    <>
      {/* Section Title - Once at the top */}
      <Text style={styles.sectionTitle}>PART IDENTIFICATION</Text>

      {/* Part Identification */}
      <View style={styles.section} wrap={false}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Client Designation:</Text>
          <Text style={styles.value}>{partData.client_designation || 'Not specified'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Reference:</Text>
          <Text style={styles.value}>{partData.reference || 'Not specified'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Quantity:</Text>
          <Text style={styles.value}>{partData.quantity || 'Not specified'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Steel Grade:</Text>
          <Text style={styles.value}>{steelGrade}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.label}>Dimensions:</Text>
          <Text style={styles.value}>{formatDimensions(partData)}</Text>
        </View>
      </View>

      {/* Specifications */}
      {(hardnessSpecs.length > 0 || ecdSpecs.length > 0) && (
        <View style={styles.section} wrap={false}>
          {/* Hardness Specifications */}
          {hardnessSpecs.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Hardness Specifications</Text>
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
              <Text style={styles.subsectionTitle}>ECD Specifications</Text>
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
      )}

      {/* Photos organized by view with intelligent layout */}
      {pageLayouts.length > 0 ? (
        pageLayouts.map((page, pageIndex) => (
          <View 
            key={`photo-page-${pageIndex}`} 
            style={[styles.section, pageIndex > 0 && styles.pageBreak]} 
            wrap={false}
          >
            {pageIndex > 0 && <Text style={styles.sectionTitle}>PART IDENTIFICATION</Text>}
            
            {page.views.map((viewData, viewIndex) => {
              const { viewName, photos } = viewData;
              const photoCount = photos.length;

              return (
                <View key={`view-${viewName}-${viewIndex}`} style={{ marginBottom: 15 }}>
                  <Text style={styles.subsectionTitle}>
                    {viewName.charAt(0).toUpperCase() + viewName.slice(1)} View
                  </Text>
                  
                  {/* Layout adaptatif selon le nombre de photos */}
                  {photoCount === 1 ? (
                    // 1 photo : pleine largeur, hauteur réduite
                    <View style={styles.photoContainerSingle}>
                      <Image 
                        src={getPhotoUrl(photos[0])} 
                        style={[styles.photo, styles.photoFullWidth]}
                      />
                      {(photos[0].description || photos[0].original_name || photos[0].name) && (
                        <Text style={styles.photoLabel}>
                          {photos[0].description || photos[0].original_name || photos[0].name}
                        </Text>
                      )}
                    </View>
                  ) : photoCount === 2 ? (
                    // 2 photos : côte à côte
                    <View style={styles.photoRow}>
                      {photos.map((photo, idx) => (
                        <View key={photo.id || idx} style={styles.photoContainerHalf}>
                          <Image 
                            src={getPhotoUrl(photo)} 
                            style={[styles.photo, styles.photoHalfWidth]}
                          />
                          {(photo.description || photo.original_name || photo.name) && (
                            <Text style={styles.photoLabel}>
                              {photo.description || photo.original_name || photo.name}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    // 3+ photos : grille 2 colonnes
                    <View style={styles.photoGrid}>
                      {photos.slice(0, 6).map((photo, idx) => (
                        <View key={photo.id || idx} style={styles.photoContainerHalf}>
                          <Image 
                            src={getPhotoUrl(photo)} 
                            style={[styles.photo, styles.photoSmall]}
                          />
                          {(photo.description || photo.original_name || photo.name) && (
                            <Text style={styles.photoLabel}>
                              {photo.description || photo.original_name || photo.name}
                            </Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))
      ) : (
        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>Photos</Text>
          <Text style={{ fontSize: 9, fontStyle: 'italic', color: '#999', marginTop: 8 }}>
            No identification photos available for this part.
          </Text>
        </View>
      )}
    </>
  );
};

export default IdentificationSectionPDF;