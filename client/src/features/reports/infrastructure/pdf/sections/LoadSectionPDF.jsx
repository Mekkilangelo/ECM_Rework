/**
 * INFRASTRUCTURE: Section Charge pour le PDF - Version Améliorée
 * Affiche les photos de configuration de charge avec pagination intelligente
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { getPhotoUrl, calculatePhotoLayout, paginatePhotos, validatePhotos } from '../helpers/photoHelpers';

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    padding: 15,
    border: '1pt solid #e0e0e0',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
    borderBottom: '2pt solid #795548',
    paddingBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#5d4037',
    backgroundColor: '#efebe9',
    padding: 8,
    borderLeft: '4pt solid #795548',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    gap: 12,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  photo: {
    objectFit: 'cover',
    border: '1pt solid #ddd',
    borderRadius: 2,
  },
  photoLabel: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 4,
    color: '#666',
    maxWidth: 160,
    lineHeight: 1.2,
  },
  loadTypeLabel: {
    fontSize: 7,
    color: '#5d4037',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
  emptyState: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    padding: 30,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  analysisInfo: {
    fontSize: 10,
    color: '#555',
    backgroundColor: '#f8f9fa',
    padding: 10,
    marginBottom: 15,
    borderRadius: 3,
    border: '1pt solid #e9ecef',
  },
  photoCounter: {
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
    marginTop: 1,
  },
  loadInfo: {
    fontSize: 10,
    color: '#5d4037',
    backgroundColor: '#efebe9',
    padding: 8,
    marginBottom: 12,
    borderRadius: 3,
    border: '1pt solid #d7ccc8',
  }
});

/**
 * Composant Section Charge pour le PDF
 */
export const LoadSectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  // Valider et traiter les photos
  const validPhotos = validatePhotos(photos || []);
  


  // Diviser les photos en pages (max 9 photos par page pour la charge)
  const photosPerPage = 9;
  const photoPages = paginatePhotos(validPhotos, photosPerPage);

  // Extraire les informations de charge depuis le rapport
  const loadData = report.loadData || {};
  const trialData = report.trialData || report.trial || {};

  if (validPhotos.length === 0) {
    return (
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>CONFIGURATION DE CHARGE</Text>
        <Text style={styles.emptyState}>
          Aucune photo de configuration de charge disponible pour cet essai.
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>CONFIGURATION DE CHARGE</Text>
        
        <Text style={styles.analysisInfo}>
          Cette section présente la configuration et la disposition de la charge dans le four lors de l'essai.
          Les photos documentent l'arrangement des pièces, les supports utilisés et la configuration générale.
          Total : {validPhotos.length} photo{validPhotos.length > 1 ? 's' : ''}
        </Text>

        {/* Informations sur la charge si disponibles */}
        {(loadData.weight || loadData.pieces_count || loadData.configuration || trialData.load_description) && (
          <View style={styles.loadInfo}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4, color: '#5d4037' }}>
              Spécifications de la charge :
            </Text>
            {loadData.weight && (
              <Text style={{ fontSize: 9, marginBottom: 2 }}>
                • Poids total : {loadData.weight} kg
              </Text>
            )}
            {loadData.pieces_count && (
              <Text style={{ fontSize: 9, marginBottom: 2 }}>
                • Nombre de pièces : {loadData.pieces_count}
              </Text>
            )}
            {loadData.configuration && (
              <Text style={{ fontSize: 9, marginBottom: 2 }}>
                • Configuration : {loadData.configuration}
              </Text>
            )}
            {trialData.load_description && (
              <Text style={{ fontSize: 9, marginBottom: 2 }}>
                • Description : {trialData.load_description}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Photos de charge avec pagination intelligente */}
      {photoPages.map((pagePhotos, pageIndex) => {
        const layout = calculatePhotoLayout(pagePhotos.length, 'load');
        
        return (
          <View key={`load-page-${pageIndex}`} style={styles.section} wrap={false}>
            <Text style={styles.subtitle}>
              Photos de Configuration {photoPages.length > 1 ? `(Page ${pageIndex + 1}/${photoPages.length})` : ''}
            </Text>
            
            <View style={styles.photoGrid}>
              {pagePhotos.map((photo, index) => (
                <View key={photo.id || photo.url || index} style={[
                  styles.photoContainer,
                  { width: `${100 / layout.cols}%` }
                ]}>
                  <Image 
                    src={getPhotoUrl(photo)} 
                    style={[
                      styles.photo,
                      { 
                        width: layout.photoWidth, 
                        height: layout.photoHeight 
                      }
                    ]}
                  />
                  {(photo.original_name || photo.name) && (
                    <Text style={styles.photoLabel}>
                      {photo.original_name || photo.name}
                    </Text>
                  )}
                  <Text style={styles.loadTypeLabel}>
                    Configuration de charge
                  </Text>
                  <Text style={styles.photoCounter}>
                    LOAD-{pageIndex * photosPerPage + index + 1}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </>
  );
};

export default LoadSectionPDF;