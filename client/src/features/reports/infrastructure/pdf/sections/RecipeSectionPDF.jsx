/**
 * INFRASTRUCTURE: Section Recette du rapport PDF
 * Affiche les données de recette (préox, cycles thermique/chimique, trempe)
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  section: {
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC3545',
    marginBottom: 15,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#DC3545'
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 10,
    marginBottom: 6,
    backgroundColor: '#F8F9FA',
    padding: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#DC3545'
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingVertical: 2
  },
  label: {
    width: '30%',
    fontSize: 10,
    color: '#666666',
    fontWeight: 'bold',
    lineHeight: 1.3
  },
  value: {
    width: '70%',
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.3
  },
  table: {
    width: '100%',
    marginTop: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 2,
    borderBottomColor: '#DC3545',
    fontWeight: 'bold'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    wrap: false
  },
  tableCell: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 9,
    borderRightWidth: 1,
    borderRightColor: '#EEEEEE',
    lineHeight: 1.3
  },
  tableCellHeader: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: 'bold',
    borderRightWidth: 1,
    borderRightColor: '#DDDDDD',
    lineHeight: 1.3
  },
  // Colonnes spécifiques pour cycle thermique
  colStep: { width: '10%' },
  colRamp: { width: '20%' },
  colSetpoint: { width: '35%' },
  colDuration: { width: '35%' },
  
  // Colonnes pour cycle chimique
  colChemStep: { width: '8%' },
  colTime: { width: '15%' },
  colGas: { width: '15%' },
  colPressure: { width: '15%' },
  colTurbine: { width: '12%' },
  
  // Colonnes pour trempe
  colQuenchStep: { width: '12%' },
  colQuenchDuration: { width: '22%' },
  colQuenchSpeed: { width: '22%' },
  colQuenchPressure: { width: '22%' },
  
  noData: {
    fontSize: 9,
    color: '#999999',
    fontStyle: 'italic',
    marginTop: 5,
    marginBottom: 10
  },
  photo: {
    marginTop: 10,
    marginBottom: 10,
    maxWidth: '100%',
    maxHeight: 200
  },
  photoCaption: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 10
  }
});

/**
 * Formater la direction de rampe
 */
const formatRamp = (ramp) => {
  const rampLabels = {
    'up': '↑ Montée',
    'down': '↓ Descente',
    'continue': '→ Maintien'
  };
  return rampLabels[ramp] || ramp;
};

/**
 * Vérifier si une section de trempe contient des données significatives
 */
const hasQuenchData = (quenchData) => {
  if (!quenchData) return false;
  
  const gasQuench = quenchData.gas_quench;
  const oilQuench = quenchData.oil_quench;
  
  // Vérifier trempe gaz
  const hasGasData = gasQuench && (
    (gasQuench.speed_parameters && gasQuench.speed_parameters.length > 0) ||
    (gasQuench.pressure_parameters && gasQuench.pressure_parameters.length > 0) ||
    (gasQuench.inerting_delay?.value && gasQuench.inerting_delay.value !== 0) ||
    (gasQuench.inerting_pressure?.value && gasQuench.inerting_pressure.value !== 0)
  );
  
  // Vérifier trempe huile
  const hasOilData = oilQuench && (
    (oilQuench.speed_parameters && oilQuench.speed_parameters.length > 0) ||
    (oilQuench.temperature?.value && oilQuench.temperature.value !== 0) ||
    (oilQuench.inerting_delay?.value && oilQuench.inerting_delay.value !== 0) ||
    (oilQuench.dripping_time?.value && oilQuench.dripping_time.value !== 0) ||
    (oilQuench.pressure && oilQuench.pressure !== 0)
  );
  
  return hasGasData || hasOilData;
};

/**
 * Section Préoxydation
 */
const PreoxSection = ({ recipeData }) => {
  if (!recipeData?.preox || 
      (!recipeData.preox.temperature?.value && 
       !recipeData.preox.duration?.value && 
       !recipeData.preox.media)) {
    return null;
  }

  const preox = recipeData.preox;

  return (
    <>
      <Text style={styles.subsectionTitle}>Préoxydation</Text>
      
      {preox.temperature?.value && (
        <View style={styles.row}>
          <Text style={styles.label}>Température:</Text>
          <Text style={styles.value}>
            {preox.temperature.value} {preox.temperature.unit || '°C'}
          </Text>
        </View>
      )}
      
      {preox.duration?.value && (
        <View style={styles.row}>
          <Text style={styles.label}>Durée:</Text>
          <Text style={styles.value}>
            {preox.duration.value} {preox.duration.unit || 'min'}
          </Text>
        </View>
      )}
      
      {preox.media && (
        <View style={styles.row}>
          <Text style={styles.label}>Milieu:</Text>
          <Text style={styles.value}>{preox.media}</Text>
        </View>
      )}
    </>
  );
};

/**
 * Section Cycle Thermique
 */
const ThermalCycleSection = ({ recipeData }) => {
  if (!recipeData?.thermal_cycle || recipeData.thermal_cycle.length === 0) {
    return null;
  }

  // Si le tableau a peu d'éléments (< 20), on le garde ensemble sur une page
  const shouldKeepTogether = recipeData.thermal_cycle.length < 20;

  return (
    <View wrap={!shouldKeepTogether}>
      <Text style={styles.subsectionTitle}>Cycle Thermique</Text>
      
      <View style={styles.table} wrap={!shouldKeepTogether}>
        {/* En-tête */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellHeader, styles.colStep]}>Étape</Text>
          <Text style={[styles.tableCellHeader, styles.colRamp]}>Rampe</Text>
          <Text style={[styles.tableCellHeader, styles.colSetpoint]}>Consigne (°C)</Text>
          <Text style={[styles.tableCellHeader, styles.colDuration]}>Durée (min)</Text>
        </View>
        
        {/* Lignes */}
        {recipeData.thermal_cycle.map((step, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colStep]}>{step.step || index + 1}</Text>
            <Text style={[styles.tableCell, styles.colRamp]}>{formatRamp(step.ramp)}</Text>
            <Text style={[styles.tableCell, styles.colSetpoint]}>{step.setpoint || '-'}</Text>
            <Text style={[styles.tableCell, styles.colDuration]}>{step.duration || '-'}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * Section Cycle Chimique
 */
const ChemicalCycleSection = ({ recipeData }) => {
  if (!recipeData?.chemical_cycle || recipeData.chemical_cycle.length === 0) {
    return null;
  }

  // Détecter quels gaz sont utilisés
  const hasGas1 = recipeData.selected_gas1;
  const hasGas2 = recipeData.selected_gas2;
  const hasGas3 = recipeData.selected_gas3;

  // Si le tableau a peu d'éléments (< 15), on le garde ensemble
  const shouldKeepTogether = recipeData.chemical_cycle.length < 15;

  return (
    <View wrap={!shouldKeepTogether}>
      <Text style={styles.subsectionTitle}>Cycle Chimique</Text>
      
      {/* Gaz sélectionnés */}
      <View style={styles.row}>
        <Text style={styles.label}>Gaz configurés:</Text>
        <Text style={styles.value}>
          {[hasGas1, hasGas2, hasGas3].filter(Boolean).join(', ') || 'Aucun'}
        </Text>
      </View>
      
      {/* Paramètres d'attente */}
      {recipeData.wait_time?.value && (
        <View style={styles.row}>
          <Text style={styles.label}>Temps d'attente:</Text>
          <Text style={styles.value}>
            {recipeData.wait_time.value} {recipeData.wait_time.unit || 'min'}
          </Text>
        </View>
      )}
      
      {recipeData.cell_temp?.value && (
        <View style={styles.row}>
          <Text style={styles.label}>Température cellule:</Text>
          <Text style={styles.value}>
            {recipeData.cell_temp.value} {recipeData.cell_temp.unit || '°C'}
          </Text>
        </View>
      )}
      
      {recipeData.wait_pressure?.value && (
        <View style={styles.row}>
          <Text style={styles.label}>Pression d'attente:</Text>
          <Text style={styles.value}>
            {recipeData.wait_pressure.value} {recipeData.wait_pressure.unit || 'mb'}
          </Text>
        </View>
      )}
      
      {/* Tableau du cycle */}
      <View style={styles.table} wrap={!shouldKeepTogether}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCellHeader, styles.colChemStep]}>Étape</Text>
          <Text style={[styles.tableCellHeader, styles.colTime]}>Temps (s)</Text>
          {hasGas1 && <Text style={[styles.tableCellHeader, styles.colGas]}>{hasGas1} (Nl/h)</Text>}
          {hasGas2 && <Text style={[styles.tableCellHeader, styles.colGas]}>{hasGas2} (Nl/h)</Text>}
          {hasGas3 && <Text style={[styles.tableCellHeader, styles.colGas]}>{hasGas3} (Nl/h)</Text>}
          <Text style={[styles.tableCellHeader, styles.colPressure]}>Pression (mb)</Text>
          <Text style={[styles.tableCellHeader, styles.colTurbine]}>Turbine</Text>
        </View>
        
        {recipeData.chemical_cycle.map((step, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.colChemStep]}>{step.step || index + 1}</Text>
            <Text style={[styles.tableCell, styles.colTime]}>{step.time || '-'}</Text>
            {hasGas1 && <Text style={[styles.tableCell, styles.colGas]}>{step.gases?.find(g => g.gas === hasGas1)?.debit || '-'}</Text>}
            {hasGas2 && <Text style={[styles.tableCell, styles.colGas]}>{step.gases?.find(g => g.gas === hasGas2)?.debit || '-'}</Text>}
            {hasGas3 && <Text style={[styles.tableCell, styles.colGas]}>{step.gases?.find(g => g.gas === hasGas3)?.debit || '-'}</Text>}
            <Text style={[styles.tableCell, styles.colPressure]}>{step.pressure || '-'}</Text>
            <Text style={[styles.tableCell, styles.colTurbine]}>{step.turbine ? 'Oui' : 'Non'}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * Section Trempe Gaz
 */
const GasQuenchSection = ({ quenchData }) => {
  const gasQuench = quenchData?.gas_quench;
  
  if (!gasQuench) return null;

  const hasSpeedParams = gasQuench.speed_parameters && gasQuench.speed_parameters.length > 0;
  const hasPressureParams = gasQuench.pressure_parameters && gasQuench.pressure_parameters.length > 0;

  // Vérifier si au moins une donnée significative existe
  const hasAnyData = hasSpeedParams || 
                     hasPressureParams || 
                     (gasQuench.inerting_delay?.value && gasQuench.inerting_delay.value !== 0) ||
                     (gasQuench.inerting_pressure?.value && gasQuench.inerting_pressure.value !== 0);

  if (!hasAnyData) return null;

  // Petits tableaux de trempe : toujours garder ensemble (généralement < 10 éléments)
  const shouldKeepTogether = true;

  return (
    <View wrap={!shouldKeepTogether}>
      <Text style={styles.subsectionTitle}>Trempe Gaz</Text>
      
      {gasQuench.inerting_delay?.value && (
        <View style={styles.row}>
          <Text style={styles.label}>Délai d'inertage:</Text>
          <Text style={styles.value}>
            {gasQuench.inerting_delay.value} {gasQuench.inerting_delay.unit || 's'}
          </Text>
        </View>
      )}
      
      {gasQuench.inerting_pressure?.value && (
        <View style={styles.row}>
          <Text style={styles.label}>Pression d'inertage:</Text>
          <Text style={styles.value}>
            {gasQuench.inerting_pressure.value} {gasQuench.inerting_pressure.unit || 'mb'}
          </Text>
        </View>
      )}
      
      {/* Paramètres de vitesse */}
      {hasSpeedParams && (
        <View style={styles.table}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', marginTop: 6, marginBottom: 3 }}>
            Paramètres de vitesse
          </Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, styles.colQuenchStep]}>Étape</Text>
            <Text style={[styles.tableCellHeader, styles.colQuenchDuration]}>Durée (s)</Text>
            <Text style={[styles.tableCellHeader, styles.colQuenchSpeed]}>Vitesse (rpm)</Text>
          </View>
          
          {gasQuench.speed_parameters.map((param, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colQuenchStep]}>{param.step || index + 1}</Text>
              <Text style={[styles.tableCell, styles.colQuenchDuration]}>{param.duration || '-'}</Text>
              <Text style={[styles.tableCell, styles.colQuenchSpeed]}>{param.speed || '-'}</Text>
            </View>
          ))}
        </View>
      )}
      
      {/* Paramètres de pression */}
      {hasPressureParams && (
        <View style={styles.table}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', marginTop: 6, marginBottom: 3 }}>
            Paramètres de pression
          </Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, styles.colQuenchStep]}>Étape</Text>
            <Text style={[styles.tableCellHeader, styles.colQuenchDuration]}>Durée (s)</Text>
            <Text style={[styles.tableCellHeader, styles.colQuenchPressure]}>Pression (mb)</Text>
          </View>
          
          {gasQuench.pressure_parameters.map((param, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colQuenchStep]}>{param.step || index + 1}</Text>
              <Text style={[styles.tableCell, styles.colQuenchDuration]}>{param.duration || '-'}</Text>
              <Text style={[styles.tableCell, styles.colQuenchPressure]}>{param.pressure || '-'}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Section Trempe Huile
 */
const OilQuenchSection = ({ quenchData }) => {
  const oilQuench = quenchData?.oil_quench;
  
  if (!oilQuench) return null;

  const hasSpeedParams = oilQuench.speed_parameters && oilQuench.speed_parameters.length > 0;
  
  // Vérifier si au moins une donnée significative existe
  const hasAnyData = hasSpeedParams ||
                     (oilQuench.temperature?.value && oilQuench.temperature.value !== 0) ||
                     (oilQuench.inerting_delay?.value && oilQuench.inerting_delay.value !== 0) ||
                     (oilQuench.dripping_time?.value && oilQuench.dripping_time.value !== 0) ||
                     (oilQuench.pressure && oilQuench.pressure !== 0);

  if (!hasAnyData) return null;

  return (
    <View wrap={false}>
      <Text style={styles.subsectionTitle}>Trempe Huile</Text>
      
      {oilQuench.temperature?.value && (
        <View style={styles.row}>
          <Text style={styles.label}>Température huile:</Text>
          <Text style={styles.value}>
            {oilQuench.temperature.value} {oilQuench.temperature.unit || '°C'}
          </Text>
        </View>
      )}
      
      {oilQuench.inerting_delay?.value && (
        <View style={styles.row}>
          <Text style={styles.label}>Délai d'inertage:</Text>
          <Text style={styles.value}>
            {oilQuench.inerting_delay.value} {oilQuench.inerting_delay.unit || 's'}
          </Text>
        </View>
      )}
      
      {oilQuench.dripping_time?.value && (
        <View style={styles.row}>
          <Text style={styles.label}>Temps d'égouttage:</Text>
          <Text style={styles.value}>
            {oilQuench.dripping_time.value} {oilQuench.dripping_time.unit || 's'}
          </Text>
        </View>
      )}
      
      {hasSpeedParams && (
        <View style={styles.table}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', marginTop: 6, marginBottom: 3 }}>
            Paramètres de vitesse
          </Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, styles.colQuenchStep]}>Étape</Text>
            <Text style={[styles.tableCellHeader, styles.colQuenchDuration]}>Durée (s)</Text>
            <Text style={[styles.tableCellHeader, styles.colQuenchSpeed]}>Vitesse (rpm)</Text>
          </View>
          
          {oilQuench.speed_parameters.map((param, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colQuenchStep]}>{param.step || index + 1}</Text>
              <Text style={[styles.tableCell, styles.colQuenchDuration]}>{param.duration || '-'}</Text>
              <Text style={[styles.tableCell, styles.colQuenchSpeed]}>{param.speed || '-'}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

/**
 * Section Photos Recette
 */
const RecipePhotosSection = ({ photos = [] }) => {
  if (!photos || photos.length === 0) return null;

  return (
    <>
      <Text style={styles.subsectionTitle}>Photos</Text>
      {photos.map((photo, index) => (
        <View key={index}>
          <Image
            style={styles.photo}
            src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/files/${photo.node_id}`}
          />
          <Text style={styles.photoCaption}>
            {photo.original_name || `Photo ${index + 1}`}
          </Text>
        </View>
      ))}
    </>
  );
};

/**
 * Composant principal: Section Recette complète
 */
export const RecipeSectionPDF = ({ report }) => {
  console.log('🍳 RecipeSectionPDF render', { 
    hasReport: !!report,
    hasRecipeData: !!report?.recipeData,
    hasQuenchData: !!report?.quenchData,
    recipeData: report?.recipeData,
    quenchData: report?.quenchData
  });
  
  const recipeData = report.recipeData;
  const quenchData = report.quenchData;
  const photos = report.sectionFiles?.recipe || [];

  // Si aucune donnée de recette
  if (!recipeData && !quenchData) {
    return (
      <View style={styles.section} break>
        <Text style={styles.sectionTitle}>2. Recette</Text>
        <Text style={styles.noData}>Aucune donnée de recette disponible</Text>
      </View>
    );
  }

  return (
    <>
      {/* Page principale : Titre + Numéro + Préox - toujours ensemble */}
      <View style={styles.section} break wrap={false}>
        <Text style={styles.sectionTitle}>2. Recette</Text>
        
        {recipeData?.number && (
          <View style={styles.row}>
            <Text style={styles.label}>Numéro de recette:</Text>
            <Text style={styles.value}>{recipeData.number}</Text>
          </View>
        )}
        
        <PreoxSection recipeData={recipeData} />
      </View>
        
      {/* Cycle Thermique - wrap intelligent selon taille */}
      <ThermalCycleSection recipeData={recipeData} />

      {/* Cycle chimique - wrap intelligent selon taille */}
      {recipeData?.chemical_cycle && recipeData.chemical_cycle.length > 0 && (
        <ChemicalCycleSection recipeData={recipeData} />
      )}

      {/* Trempe - afficher uniquement si données significatives */}
      {hasQuenchData(quenchData) && (
        <>
          <GasQuenchSection quenchData={quenchData} />
          <OilQuenchSection quenchData={quenchData} />
        </>
      )}

      {/* Photos - nouvelle page */}
      {photos.length > 0 && (
        <View break>
          <RecipePhotosSection photos={photos} />
        </View>
      )}
    </>
  );
};
