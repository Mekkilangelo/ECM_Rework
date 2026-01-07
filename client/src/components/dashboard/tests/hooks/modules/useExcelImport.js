import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

const useExcelImport = (
  formData,
  handleChange
) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [currentSampleInfo, setCurrentSampleInfo] = useState({ resultIndex: 0, sampleIndex: 0 });

  // Fonction pour déclencher l'ouverture du file picker
  const handleExcelImport = (resultIndex = 0, sampleIndex = 0) => {
    setCurrentSampleInfo({ resultIndex, sampleIndex });
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Fonction pour traiter le fichier sélectionné
  const processExcelData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        processExcelFileData(jsonData, currentSampleInfo.resultIndex, currentSampleInfo.sampleIndex);
      } catch (error) {
        console.error('Erreur lors de la lecture du fichier Excel:', error);
        alert(t('tests.after.results.import.error'));
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset du input file
    event.target.value = '';
  };

  // Fonction pour traiter les données Excel pour un échantillon spécifique
  const processExcelFileData = async (data, resultIndex, sampleIndex) => {
    if (!data || data.length === 0) return;

    
    

    /*
    LOGIQUE DE TRAITEMENT SELON LES SPÉCIFICATIONS :
    
    CAS NORMAL (pas de valeur dans $STAT.MEAN.L(i)) :
    - Position hardnessResult : $LOCNAME.L(i)
    - Valeur hardnessResult : $STAT.SURFHVAL.L(i)
    - Position ECD : $LOCNAME.L(i)
    - Distance ECD : $STAT.CHD1.L(i)
    - Distances courbe : $DISTANCE.L(i)
    - Valeurs courbe : $HVALUE.L(i)
    
    CAS CŒUR (valeur présente dans $STAT.MEAN.L(i)) :
    - Position hardnessResult : $LOCNAME.L(i)
    - Valeur hardnessResult : $STAT.MEAN.L(i)
    - Passer à la filiation suivante (pas de traitement ECD/courbe)
    */

    const dataRows = data;
    
    
    

    // Analyser les 7 filiations fixes possibles
    const allFiliations = [];
    
    // Pattern des colonnes pour chaque filiation (8 colonnes + 1 séparateur)
    for (let i = 1; i <= 7; i++) {
      const baseIndex = (i - 1) * 9;
      
      const locNameIndex = baseIndex;
      const hasData = dataRows[0][locNameIndex] && 
        dataRows[0][locNameIndex] !== '' && 
        !dataRows[0][locNameIndex].toString().startsWith('$');
      
      if (hasData) {
        
        
        const meanIndex = baseIndex + 3;
        const isCore = dataRows[0][meanIndex] && 
          dataRows[0][meanIndex] !== '' && 
          !dataRows[0][meanIndex].toString().startsWith('$') &&
          !isNaN(parseFloat(dataRows[0][meanIndex].toString().replace(',', '.')));
        
        allFiliations.push({
          index: i,
          locNameIndex: baseIndex,           // $LOCNAME.L(i)
          surfHvalIndex: baseIndex + 1,      // $STAT.SURFHVAL.L(i)
          chdIndex: baseIndex + 2,           // $STAT.CHD1.L(i)
          meanIndex: baseIndex + 3,          // $STAT.MEAN.L(i)
          baseIndex: baseIndex + 4,          // $STAT.BASE1.L(i)
          distanceIndex: baseIndex + 5,      // $DISTANCE.L(i)
          hvalueIndex: baseIndex + 6,        // $HVALUE.L(i)
          hscaleIndex: baseIndex + 7,        // $HSCALE.L(i)
          isCore: isCore
        });
      }
    }

    if (allFiliations.length === 0) {
      alert(t('tests.after.results.import.noData'));
      return;
    }

    console.log(`${allFiliations.length} filiations détectées:`, allFiliations.map(f => ({
      index: f.index,
      isCore: f.isCore
    })));

    // Préparer les structures de données
    const hardnessResults = [];
    const ecdPositions = [];
    const curveDistances = [];
    const curveSeries = [];

    // Déterminer quelle filiation utiliser pour les distances de courbe
    const normalFiliations = allFiliations.filter(f => !f.isCore);
    const distanceFiliation = normalFiliations[0] || allFiliations[0];

    // ÉTAPE 1 : Traiter les données de base et préparer les structures
    
    
    for (let filiationIndex = 0; filiationIndex < allFiliations.length; filiationIndex++) {
      const filiation = allFiliations[filiationIndex];

      const firstDataRow = dataRows[0];
      const locationName = firstDataRow[filiation.locNameIndex];
      const surfHval = firstDataRow[filiation.surfHvalIndex];
      const chd = firstDataRow[filiation.chdIndex];
      const mean = firstDataRow[filiation.meanIndex];
      const base = firstDataRow[filiation.baseIndex];
      const hscale = firstDataRow[filiation.hscaleIndex];

      // Convertir les valeurs numériques et arrondir à 2 décimales
      const surfHvalNum = surfHval && surfHval !== '' && !surfHval.toString().startsWith('$') ? 
        Math.round(parseFloat(surfHval.toString().replace(',', '.')) * 100) / 100 : null;
      const chdNum = chd && chd !== '' && !chd.toString().startsWith('$') ? 
        Math.round(parseFloat(chd.toString().replace(',', '.')) * 100) / 100 : null;
      const meanNum = mean && mean !== '' && !mean.toString().startsWith('$') ? 
        Math.round(parseFloat(mean.toString().replace(',', '.')) * 100) / 100 : null;

      // Déterminer la valeur de dureté pour hardnessResult
      let hardnessResultValue = null;
      if (filiation.isCore && meanNum !== null && !isNaN(meanNum)) {
        hardnessResultValue = meanNum;
      } else if (!filiation.isCore && surfHvalNum !== null && !isNaN(surfHvalNum)) {
        hardnessResultValue = surfHvalNum;
      }

      // Ajouter aux résultats de dureté
      if (hardnessResultValue !== null) {
        hardnessResults.push({
          location: locationName || '',
          value: hardnessResultValue.toFixed(2),
          unit: hscale || ''
        });
      }

      // Ajouter aux positions ECD (seulement pour les filiations non-cœur)
      if (!filiation.isCore && chdNum !== null && !isNaN(chdNum)) {
        ecdPositions.push({
          position: locationName || '',
          distance: chdNum.toFixed(2)
        });
      }

      // Traiter les données de courbe (seulement pour les filiations non-cœur)
      if (!filiation.isCore) {
        const serieValues = [];
        
        // Extraire toutes les valeurs de courbe pour cette filiation
        dataRows.forEach((row, rowIndex) => {
          const distance = row[filiation.distanceIndex];
          const hvalue = row[filiation.hvalueIndex];
          
          if (distance !== undefined && distance !== null && distance !== '' &&
              hvalue !== undefined && hvalue !== null && hvalue !== '' &&
              !distance.toString().startsWith('$') && 
              !hvalue.toString().startsWith('$')) {
              
            const distanceNum = Math.round(parseFloat(distance.toString().replace(',', '.')) * 100) / 100;
            const hvalueNum = Math.round(parseFloat(hvalue.toString().replace(',', '.')) * 100) / 100;
            
            if (!isNaN(distanceNum) && !isNaN(hvalueNum)) {
              // Si c'est la filiation de référence, créer les distances
              if (filiation === distanceFiliation) {
                curveDistances.push(distanceNum);
              }
              
              serieValues.push(hvalueNum);
            }
          } else {
            // Ajouter une valeur vide pour les cellules sans données
            serieValues.push('');
          }
        });
        
        // Ajouter la série pour cette filiation
        if (serieValues.length > 0) {
          curveSeries.push({
            name: locationName || `Position_${filiation.index}`,
            values: serieValues
          });
        }
      }
    }

    // ÉTAPE 2 : Mettre à jour les données du formulaire
    
    
    await updateFormDataWithImportedData(
      resultIndex,
      sampleIndex,
      hardnessResults,
      ecdPositions,
      { distances: curveDistances, series: curveSeries }
    );

    // Message de succès
    alert(t('tests.after.results.import.success', { count: allFiliations.length }));
  };

  // Fonction pour mettre à jour le formData avec les données importées
  const updateFormDataWithImportedData = async (resultIndex, sampleIndex, hardnessResults, ecdPositions, curveData) => {
    

    // Créer une copie du formData actuel
    const updatedFormData = { ...formData };
    
    // S'assurer que la structure existe
    if (!updatedFormData.resultsData) {
      updatedFormData.resultsData = { results: [] };
    }
    if (!updatedFormData.resultsData.results[resultIndex]) {
      updatedFormData.resultsData.results[resultIndex] = { samples: [] };
    }
    if (!updatedFormData.resultsData.results[resultIndex].samples[sampleIndex]) {
      updatedFormData.resultsData.results[resultIndex].samples[sampleIndex] = {};
    }

    const sample = updatedFormData.resultsData.results[resultIndex].samples[sampleIndex];

    // Mettre à jour les points de dureté
    sample.hardnessPoints = hardnessResults;

    // Mettre à jour les positions ECD
    if (!sample.ecd) {
      sample.ecd = { hardnessValue: '', hardnessUnit: '', ecdPoints: [] };
    }
    sample.ecd.ecdPoints = ecdPositions;

    // Mettre à jour les données de courbe
    sample.curveData = curveData;

    // Appliquer les changements
    handleChange({
      target: {
        name: 'resultsData',
        value: updatedFormData.resultsData
      }
    });

    
  };

  return {
    fileInputRef,
    handleExcelImport,
    processExcelData
  };
};

export default useExcelImport;
