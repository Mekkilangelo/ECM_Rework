/**
 * INFRASTRUCTURE: Section Identification pour le PDF - Version Améliorée
 * Affiche les informations complètes du client, de la pièce et les photos avec pagination intelligente
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
    borderBottom: '2pt solid #c62828',
    paddingBottom: 6,
    textAlign: 'center',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#34495e',
    backgroundColor: '#f8f9fa',
    padding: 6,
    borderLeft: '3pt solid #007bff',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  infoColumn: {
    width: '50%',
    paddingRight: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    width: '40%',
    color: '#555',
  },
  value: {
    fontSize: 10,
    width: '60%',
    color: '#000',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  photoContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  photo: {
    objectFit: 'cover',
    border: '1pt solid #ccc',
    borderRadius: 2,
  },
  photoLabel: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 4,
    color: '#666',
    maxWidth: 120,
  },
  emptyState: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  dimensionText: {
    fontSize: 10,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  pageBreak: {
    marginTop: 20,
    borderTop: '1pt dashed #ccc',
    paddingTop: 15,
  }
});

/**
 * Composant Section Identification pour le PDF
 */
export const IdentificationSectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  // Valider et traiter les photos
  const validPhotos = validatePhotos(photos || []);
  


  // Diviser les photos en pages (max 12 photos par page)
  const photosPerPage = 12;
  const photoPages = paginatePhotos(validPhotos, photosPerPage);

  // Formater les dimensions pour l'affichage
  const formatDimensions = (part) => {
    const dims = [];
    
    // Dimensions rectangulaires
    if (part.dim_rect_length || part.dim_rect_width || part.dim_rect_height) {
      const rectDims = [part.dim_rect_length, part.dim_rect_width, part.dim_rect_height]
        .filter(d => d)
        .join(' × ');
      if (rectDims) {
        dims.push(`${rectDims} ${part.dim_rect_unit || 'mm'}`);
      }
    }
    
    // Dimensions circulaires
    if (part.dim_circ_diameterOut || part.dim_circ_diameterIn) {
      const circDims = [];
      if (part.dim_circ_diameterOut) circDims.push(`⌀ ext: ${part.dim_circ_diameterOut}`);
      if (part.dim_circ_diameterIn) circDims.push(`⌀ int: ${part.dim_circ_diameterIn}`);
      dims.push(`${circDims.join(', ')} ${part.dim_circ_unit || 'mm'}`);
    }
    
    // Poids
    if (part.dim_weight_value) {
      dims.push(`${part.dim_weight_value} ${part.dim_weight_unit || 'kg'}`);
    }
    
    return dims.join(' | ') || 'Non spécifié';
  };

  // Extraire les données du rapport
  const clientData = report.clientData || report.client || {};
  const partData = report.partData || report.part || {};
  const trialData = report.trialData || report.trial || {};

  return (
    <>
      <View style={styles.section} wrap={false}>
        <Text style={styles.sectionTitle}>IDENTIFICATION DE LA PIÈCE</Text>

        {/* Informations Client */}
        <Text style={styles.subsectionTitle}>Informations Client</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <View style={styles.row}>
              <Text style={styles.label}>Client :</Text>
              <Text style={styles.value}>{clientData.name || 'Non spécifié'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Pays :</Text>
              <Text style={styles.value}>{clientData.country || 'Non spécifié'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Contact :</Text>
              <Text style={styles.value}>{clientData.contact || 'Non spécifié'}</Text>
            </View>
          </View>
          <View style={styles.infoColumn}>
            <View style={styles.row}>
              <Text style={styles.label}>Adresse :</Text>
              <Text style={styles.value}>{clientData.address || 'Non spécifiée'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Email :</Text>
              <Text style={styles.value}>{clientData.email || 'Non spécifié'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Téléphone :</Text>
              <Text style={styles.value}>{clientData.phone || 'Non spécifié'}</Text>
            </View>
          </View>
        </View>

        {/* Informations Pièce */}
        <Text style={styles.subsectionTitle}>Spécifications de la Pièce</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <View style={styles.row}>
              <Text style={styles.label}>Désignation :</Text>
              <Text style={styles.value}>{partData.designation || 'Non spécifiée'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Désignation client :</Text>
              <Text style={styles.value}>{partData.client_designation || 'Non spécifiée'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Référence :</Text>
              <Text style={styles.value}>{partData.reference || 'Non spécifiée'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Quantité :</Text>
              <Text style={styles.value}>{partData.quantity || 'Non spécifiée'}</Text>
            </View>
          </View>
          <View style={styles.infoColumn}>
            <View style={styles.row}>
              <Text style={styles.label}>Acier :</Text>
              <Text style={styles.value}>{partData.steel?.name || partData.steelName || 'Non spécifié'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Dimensions :</Text>
              <Text style={[styles.value, styles.dimensionText]}>{formatDimensions(partData)}</Text>
            </View>
          </View>
        </View>

        {/* Informations Essai */}
        <Text style={styles.subsectionTitle}>Informations d'Essai</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoColumn}>
            <View style={styles.row}>
              <Text style={styles.label}>Code d'essai :</Text>
              <Text style={styles.value}>{trialData.test_code || report.testCode || 'Non spécifié'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Date création :</Text>
              <Text style={styles.value}>
                {trialData.created_at ? new Date(trialData.created_at).toLocaleDateString('fr-FR') : 'Non spécifiée'}
              </Text>
            </View>
          </View>
          <View style={styles.infoColumn}>
            <View style={styles.row}>
              <Text style={styles.label}>Statut :</Text>
              <Text style={styles.value}>{trialData.status || 'Non spécifié'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Remarques :</Text>
              <Text style={styles.value}>{trialData.comments || 'Aucune'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Photos d'identification avec pagination intelligente */}
      {photoPages.length > 0 && photoPages.map((pagePhotos, pageIndex) => {
        const layout = calculatePhotoLayout(pagePhotos.length, 'identification');
        
        return (
          <View key={`photo-page-${pageIndex}`} style={[styles.section, pageIndex > 0 && styles.pageBreak]} wrap={false}>
            <Text style={styles.subsectionTitle}>
              Photos d'identification {photoPages.length > 1 ? `(Page ${pageIndex + 1}/${photoPages.length})` : ''}
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
                  <Text style={[styles.photoLabel, { fontSize: 7, color: '#999' }]}>
                    Photo {pageIndex * photosPerPage + index + 1}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {/* Message si aucune photo */}
      {validPhotos.length === 0 && (
        <View style={styles.section}>
          <Text style={styles.subsectionTitle}>Photos d'identification</Text>
          <Text style={styles.emptyState}>
            Aucune photo d'identification disponible pour cette pièce.
          </Text>
        </View>
      )}
    </>
  );
};

export default IdentificationSectionPDF;