/**
 * INFRASTRUCTURE: Section Identification pour le PDF
 * Affiche les informations du client, de la pièce et de l'essai
 */

import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    padding: 10,
    border: '1pt solid #e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
    borderBottom: '2pt solid #c62828',
    paddingBottom: 4,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    color: '#34495e',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    width: '30%',
    color: '#555',
  },
  value: {
    fontSize: 10,
    width: '70%',
    color: '#000',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  photoContainer: {
    width: '23%',
    marginBottom: 8,
  },
  photo: {
    width: '100%',
    height: 100,
    objectFit: 'cover',
    border: '1pt solid #ccc',
  },
  photoLabel: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 2,
    color: '#666',
  },
  emptyState: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#999',
  },
});

/**
 * Composant Section Identification pour le PDF
 */
export const IdentificationSectionPDF = ({ report, photos = [] }) => {
  if (!report) return null;

  // S'assurer que photos est toujours un tableau valide
  const validPhotos = (() => {
    if (!photos) return [];
    if (Array.isArray(photos)) return photos;
    
    // Si c'est un objet avec des sous-catégories, les aplatir
    if (typeof photos === 'object') {
      const flatPhotos = [];
      Object.values(photos).forEach(categoryPhotos => {
        if (Array.isArray(categoryPhotos)) {
          flatPhotos.push(...categoryPhotos);
        }
      });
      return flatPhotos;
    }
    
    return [];
  })();

  // Helper pour obtenir l'URL de la photo
  const getPhotoUrl = (photo) => {
    if (!photo) return '';
    
    // Si l'URL est déjà présente
    if (photo.url) return photo.url;
    
    // Si c'est un file_path serveur, construire l'URL
    if (photo.file_path) {
      // Le backend sert les fichiers depuis /uploads
      return `http://localhost:5001${photo.file_path.replace(/\\/g, '/')}`;
    }
    
    // Si c'est juste un ID de fichier
    if (photo.id || photo.node_id) {
      return `http://localhost:5001/api/files/${photo.id || photo.node_id}/preview`;
    }
    
    return '';
  };

  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>IDENTIFICATION</Text>

      {/* Informations Client */}
      <Text style={styles.subsectionTitle}>Client</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Nom :</Text>
        <Text style={styles.value}>{report.clientName || 'N/A'}</Text>
      </View>
      {report.clientData ? (
        <>
          {report.clientData.client_code && (
            <View style={styles.row}>
              <Text style={styles.label}>Code :</Text>
              <Text style={styles.value}>{report.clientData.client_code}</Text>
            </View>
          )}
          {report.clientData.city && (
            <View style={styles.row}>
              <Text style={styles.label}>Ville :</Text>
              <Text style={styles.value}>{report.clientData.city}</Text>
            </View>
          )}
          {report.clientData.country && (
            <View style={styles.row}>
              <Text style={styles.label}>Pays :</Text>
              <Text style={styles.value}>{report.clientData.country}</Text>
            </View>
          )}
          {report.clientData.client_group && (
            <View style={styles.row}>
              <Text style={styles.label}>Groupe :</Text>
              <Text style={styles.value}>{report.clientData.client_group}</Text>
            </View>
          )}
          {report.clientData.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Adresse :</Text>
              <Text style={styles.value}>{report.clientData.address}</Text>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.emptyState}>Aucune donnée client disponible</Text>
      )}

      {/* Informations Pièce */}
      <Text style={styles.subsectionTitle}>Pièce</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Nom :</Text>
        <Text style={styles.value}>{report.partName || 'N/A'}</Text>
      </View>
      {report.partData ? (
        <>
          {report.partData.part_code && (
            <View style={styles.row}>
              <Text style={styles.label}>Code :</Text>
              <Text style={styles.value}>{report.partData.part_code}</Text>
            </View>
          )}
          {report.partData.designation && (
            <View style={styles.row}>
              <Text style={styles.label}>Désignation :</Text>
              <Text style={styles.value}>{report.partData.designation}</Text>
            </View>
          )}
          {report.partData.mass && (
            <View style={styles.row}>
              <Text style={styles.label}>Masse :</Text>
              <Text style={styles.value}>
                {report.partData.mass} {report.partData.dim_weight_unit || 'kg'}
              </Text>
            </View>
          )}
          {(report.partData.dim_length || report.partData.dim_width || report.partData.dim_height) && (
            <View style={styles.row}>
              <Text style={styles.label}>Dimensions :</Text>
              <Text style={styles.value}>
                {report.partData.dim_length || '?'} x {report.partData.dim_width || '?'} x {report.partData.dim_height || '?'} mm
              </Text>
            </View>
          )}
        </>
      ) : (
        <Text style={styles.emptyState}>Aucune donnée pièce disponible</Text>
      )}

      {/* Informations Essai */}
      <Text style={styles.subsectionTitle}>Essai</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Code essai :</Text>
        <Text style={styles.value}>{report.testCode || 'N/A'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Date :</Text>
        <Text style={styles.value}>
          {report.testDate ? new Date(report.testDate).toLocaleDateString('fr-FR') : 'N/A'}
        </Text>
      </View>
      {report.status && (
        <View style={styles.row}>
          <Text style={styles.label}>Statut :</Text>
          <Text style={styles.value}>{report.status}</Text>
        </View>
      )}
      {report.location && (
        <View style={styles.row}>
          <Text style={styles.label}>Localisation :</Text>
          <Text style={styles.value}>{report.location}</Text>
        </View>
      )}

      {/* Photos d'identification */}
      {validPhotos && validPhotos.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>Photos d'identification</Text>
          <View style={styles.photoGrid}>
            {validPhotos.map((photo, index) => (
              <View key={photo.id || photo.url || index} style={styles.photoContainer}>
                <Image 
                  src={getPhotoUrl(photo)} 
                  style={styles.photo}
                />
                {(photo.original_name || photo.name) && (
                  <Text style={styles.photoLabel}>{photo.original_name || photo.name}</Text>
                )}
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

export default IdentificationSectionPDF;
