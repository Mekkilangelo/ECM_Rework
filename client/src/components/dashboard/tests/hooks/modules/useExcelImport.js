import React, { useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';

const useExcelImport = (
  formData,
  handleChange,
  handleHardnessResultAdd,
  handleHardnessChange,
  handleEcdPositionAdd,
  handleEcdPositionChange,
  handleEcdChange,
  hardnessUnitOptions
) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  
  // Fonction utilitaire pour normaliser le nom d'une position
  const normalizePositionName = (positionName) => {
    return positionName.toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
  };
  
  // Utiliser useRef pour stocker les refs sans causer de re-rendus
  const curveSectionRefsRef = useRef({});

  // Obtenir ou créer une ref pour un ResultCurveSection spécifique
  const getCurveSectionRef = useCallback((resultIndex, sampleIndex) => {
    const key = `${resultIndex}-${sampleIndex}`;
    // Si la ref existe déjà, la retourner
    if (curveSectionRefsRef.current[key]) {
      return curveSectionRefsRef.current[key];
    }
    // Créer une nouvelle ref et la stocker
    const newRef = React.createRef();
    curveSectionRefsRef.current[key] = newRef;
    return newRef;
  }, []); // Pas de dépendances pour éviter les re-créations

  // Fonction pour traiter l'import Excel
  const handleExcelImport = (event, resultIndex, sampleIndex) => {
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
        
        processExcelData(jsonData, resultIndex, sampleIndex);
      } catch (error) {
        console.error('Erreur lors de la lecture du fichier Excel:', error);
        alert(t('tests.after.results.import.error'));
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset du input file
    event.target.value = '';
  };  // Fonction pour traiter les données Excel pour un échantillon spécifique
  const processExcelData = async (data, resultIndex, sampleIndex) => {
    if (!data || data.length === 0) return;

    console.log('=== ANALYSE FICHIER EXCEL ===');
    console.log(`Import pour résultat ${resultIndex}, échantillon ${sampleIndex}`);

    /*
    LOGIQUE DE TRAITEMENT SELON LES SPÉCIFICATIONS :
    
    CAS NORMAL (pas de valeur dans $STAT.MEAN.L(i)) :
    - Position hardnessResult : $LOCNAME.L(i)
    - Valeur hardnessResult : $STAT.SURFHVAL.L(i)
    - Valeur ECD (première filiation normale seulement) : $STAT.BASE1.L(i)
    - Position ECD : $LOCNAME.L(i)
    - Distance ECD : $STAT.CHD1.L(i)
    - Distances courbe (première filiation normale seulement) : $DISTANCE.L(i)
    - Valeurs courbe : $HVALUE.L(i)
    
    CAS CŒUR (valeur présente dans $STAT.MEAN.L(i)) :
    - Position hardnessResult : $LOCNAME.L(i)
    - Valeur hardnessResult : $STAT.MEAN.L(i)
    - Passer à la filiation suivante (pas de traitement ECD/courbe)
    */    // IMPORTANT : Dans votre fichier Excel, la première ligne contient directement les données,
    // pas des en-têtes. Donc on utilise toutes les lignes comme données.
    const dataRows = data; // Toutes les lignes sont des données
    
    // DIAGNOSTIC : afficher les premières lignes de données
    console.log('=== DIAGNOSTIC STRUCTURE EXCEL ===');
    console.log('Première ligne (données):', dataRows[0]);
    console.log('Deuxième ligne (données):', dataRows[1]);
    console.log('Troisième ligne (données):', dataRows[2]);
    console.log('Nombre total de lignes de données:', dataRows.length);
    // Analyser les 7 filiations fixes possibles
    const allFiliations = [];
    
    // Pattern des colonnes pour chaque filiation (8 colonnes + 1 séparateur)
    // Filiation i: colonnes (i-1)*9 à (i-1)*9+7
    for (let i = 1; i <= 7; i++) {
      const baseIndex = (i - 1) * 9; // Index de base pour cette filiation
        // Vérifier si cette filiation contient des données (dans la première ligne principalement)
      const locNameIndex = baseIndex;
      const hasData = dataRows[0][locNameIndex] && 
        dataRows[0][locNameIndex] !== '' && 
        !dataRows[0][locNameIndex].toString().startsWith('$');
      
      if (hasData) {
        console.log(`Filiation ${i} détectée aux colonnes ${baseIndex}-${baseIndex + 7}`);
          // Vérifier si c'est un cas "cœur" (STAT.MEAN.L(i) non vide)
        // Chercher dans la première ligne de données principalement
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
    })));    // Map globale pour fusionner les données de courbe par distance
    const globalCurveDataMap = new Map();    // Déterminer quelle filiation utiliser pour les distances de courbe et les données ECD
    // Si la première filiation est un cœur, utiliser la première filiation normale
    let distanceFiliation = allFiliations[0];
    let ecdDataFiliation = allFiliations.find(f => !f.isCore) || allFiliations[0]; // Première filiation normale
    
    if (allFiliations[0].isCore) {
      const firstNormalFiliation = allFiliations.find(f => !f.isCore);
      if (firstNormalFiliation) {
        distanceFiliation = firstNormalFiliation;
        console.log('Première filiation est un cœur, utilisation de la première filiation normale pour les distances et données ECD');
      }
    }// ÉTAPE 1 : D'abord ajouter tous les points ECD nécessaires pour créer les colonnes dynamiques
    // Ne pas ajouter de points ECD pour les cœurs
    console.log('=== ÉTAPE 1 : CRÉATION DES POINTS ECD ===');
    const nonCoreFilations = allFiliations.filter(f => !f.isCore);
    console.log(`${nonCoreFilations.length} filiations non-cœur détectées pour les points ECD`);
    
    for (let filiationIndex = 0; filiationIndex < nonCoreFilations.length; filiationIndex++) {
      const filiation = nonCoreFilations[filiationIndex];
      
      // Extraire le nom de la position pour cette filiation
      const firstDataRow = dataRows[0];
      const locationName = firstDataRow[filiation.locNameIndex];
      
      console.log(`ÉTAPE 1 - Ajout point ECD pour filiation ${filiation.index}: ${locationName} (non-cœur)`);
      
      // Ajouter un point ECD pour chaque filiation non-cœur (sauf la première qui utilise les points existants)
      if (filiationIndex > 0) {
        console.log(`ÉTAPE 1 - Ajout nouveau point ECD via handleEcdPositionAdd`);
        handleEcdPositionAdd(resultIndex, sampleIndex);
        // Délai pour permettre la création des éléments DOM
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Remplir le nom du point ECD
      const ecdPointIndex = filiationIndex;
      console.log(`ÉTAPE 1 - Remplissage nom ECD[${ecdPointIndex}] = "${locationName}"`);
      handleEcdPositionChange(resultIndex, sampleIndex, ecdPointIndex, 'name', locationName || '');
    }
    
    // Délai pour s'assurer que tous les points ECD sont créés et que les colonnes dynamiques sont générées
    console.log('ÉTAPE 1 - Attente création colonnes dynamiques...');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('ÉTAPE 1 - Terminée, colonnes dynamiques normalement créées');    // Traiter chaque filiation
    for (let filiationIndex = 0; filiationIndex < allFiliations.length; filiationIndex++) {
      const filiation = allFiliations[filiationIndex];
      console.log(`=== TRAITEMENT FILIATION ${filiation.index} ${filiation.isCore ? '(CŒUR)' : ''} ===`);      // Extraire les données de base depuis la première ligne de données valides
      const firstDataRow = dataRows[0];
      const locationName = firstDataRow[filiation.locNameIndex];
      const surfHval = firstDataRow[filiation.surfHvalIndex];
      const chd = firstDataRow[filiation.chdIndex];
      const mean = firstDataRow[filiation.meanIndex]; // Valeur MEAN pour détecter le cœur
      const base = firstDataRow[filiation.baseIndex];
      const hscale = firstDataRow[filiation.hscaleIndex];

      console.log(`Filiation ${filiation.index} - Données extraites brutes:`, { 
        locationName, surfHval, chd, mean, base, hscale, isCore: filiation.isCore 
      });

      // Convertir les valeurs numériques en gérant les cas vides/undefined
      const surfHvalNum = surfHval && surfHval !== '' && !surfHval.toString().startsWith('$') ? 
        parseFloat(surfHval.toString().replace(',', '.')) : null;
      const chdNum = chd && chd !== '' && !chd.toString().startsWith('$') ? 
        parseFloat(chd.toString().replace(',', '.')) : null;
      const baseNum = base && base !== '' && !base.toString().startsWith('$') ? 
        parseFloat(base.toString().replace(',', '.')) : null;
      const meanNum = mean && mean !== '' && !mean.toString().startsWith('$') ? 
        parseFloat(mean.toString().replace(',', '.')) : null;
        console.log(`Filiation ${filiation.index} - Valeurs numériques converties:`, { 
        surfHvalNum, chdNum, baseNum, meanNum 
      });
      
      // LOG DÉTAILLÉ POUR DIAGNOSTIC
      console.log(`DIAGNOSTIC FILIATION ${filiation.index}:`);
      console.log(`- locationName: "${locationName}"`);
      console.log(`- surfHval brut: "${surfHval}" -> converti: ${surfHvalNum}`);
      console.log(`- chd brut: "${chd}" -> converti: ${chdNum}`);
      console.log(`- mean brut: "${mean}" -> converti: ${meanNum}`);
      console.log(`- base brut: "${base}" -> converti: ${baseNum}`);
      console.log(`- hscale: "${hscale}"`);
      console.log(`- isCore: ${filiation.isCore}`);
      
      // Déterminer la valeur de dureté à utiliser pour le hardnessResult selon les spécifications
      let hardnessResultValue = '';
      if (filiation.isCore && meanNum !== null && !isNaN(meanNum)) {
        // Cas cœur : utiliser MEAN pour le hardnessResult
        hardnessResultValue = meanNum;
        console.log(`Cœur détecté - Valeur hardnessResult (MEAN): ${hardnessResultValue}`);
      } else if (!filiation.isCore && surfHvalNum !== null && !isNaN(surfHvalNum)) {
        // Cas normal : utiliser SURFHVAL pour le hardnessResult
        hardnessResultValue = surfHvalNum;
        console.log(`Cas normal - Valeur hardnessResult (SURFHVAL): ${hardnessResultValue}`);
      }

      // Trouver l'option correspondante dans hardnessUnitOptions
      const unitOption = hardnessUnitOptions.find(option => 
        option.label === hscale || option.value === hscale
      );      // Toutes les filiations vont dans le même échantillon
      let targetResultIndex = resultIndex;
      let targetSampleIndex = sampleIndex;
      
      // Délai pour permettre la mise à jour des éléments DOM
      await new Promise(resolve => setTimeout(resolve, 200 * (filiationIndex + 1)));      // Vérifier le nombre de points de dureté existants et ajouter seulement si nécessaire
      const currentResultsCheck = [...formData.resultsData.results];
      const currentSampleCheck = currentResultsCheck[targetResultIndex].samples[targetSampleIndex];
      const currentHardnessPointsCount = currentSampleCheck.hardnessPoints.length;
      const requiredPointIndex = filiationIndex; // L'index requis pour cette filiation

      if (requiredPointIndex >= currentHardnessPointsCount) {
        // Ajouter un point de dureté seulement si on n'en a pas assez
        console.log(`Ajout point de dureté pour filiation ${filiation.index} (index requis: ${requiredPointIndex}, disponibles: ${currentHardnessPointsCount})...`);
        handleHardnessResultAdd(targetResultIndex, targetSampleIndex);
        
        // Délai pour s'assurer que les éléments DOM sont créés
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        console.log(`Point de dureté existant utilisé pour filiation ${filiation.index} (index: ${requiredPointIndex})`);
      }      // Remplir les champs après un délai pour s'assurer que les éléments DOM sont créés
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const currentResultsForFill = [...formData.resultsData.results];
      const currentSampleForFill = currentResultsForFill[targetResultIndex].samples[targetSampleIndex];
      
      let hardnessPointIndex, ecdPointIndex;
      
      // Utiliser directement l'index de la filiation pour les points de dureté
      hardnessPointIndex = filiationIndex;
      ecdPointIndex = filiationIndex;
      
      // S'assurer que les points existent (normalement ils devraient exister après l'ajout précédent)
      if (hardnessPointIndex >= currentSampleForFill.hardnessPoints.length) {
        hardnessPointIndex = currentSampleForFill.hardnessPoints.length - 1;
      }
      if (ecdPointIndex >= currentSampleForFill.ecd.ecdPoints.length) {
        ecdPointIndex = currentSampleForFill.ecd.ecdPoints.length - 1;
      }
      
      console.log(`Filiation ${filiation.index} - Using hardnessPointIndex: ${hardnessPointIndex}, ecdPointIndex: ${ecdPointIndex}`);      // Remplir le point de dureté avec la valeur correspondante
      handleHardnessChange(targetResultIndex, targetSampleIndex, hardnessPointIndex, 'location', locationName || '');
      if (hardnessResultValue !== '') {
        handleHardnessChange(targetResultIndex, targetSampleIndex, hardnessPointIndex, 'value', hardnessResultValue.toString());
      }
      handleHardnessChange(targetResultIndex, targetSampleIndex, hardnessPointIndex, 'unit', unitOption || null);

      // Remplir les données ECD générales (seulement pour la première filiation normale)
      if (!filiation.isCore && filiation === ecdDataFiliation) {
        console.log(`Remplissage données ECD générales depuis première filiation normale ${filiation.index}`);
        // Utiliser BASE1 pour la valeur de dureté ECD selon les spécifications
        if (baseNum !== null && !isNaN(baseNum)) {
          handleEcdChange(targetResultIndex, targetSampleIndex, 'hardnessValue', baseNum.toString());
        }
        handleEcdChange(targetResultIndex, targetSampleIndex, 'hardnessUnit', unitOption || null);
      }        // Remplir le point ECD spécifique (seulement pour les filiations non-cœur)
      if (!filiation.isCore) {
        // Trouver l'index ECD correct pour cette filiation non-cœur
        const nonCoreIndex = nonCoreFilations.findIndex(f => f.index === filiation.index);
        if (nonCoreIndex !== -1 && chdNum !== null && !isNaN(chdNum)) {
          handleEcdPositionChange(targetResultIndex, targetSampleIndex, nonCoreIndex, 'distance', chdNum.toString());
          console.log(`Distance ECD remplie pour filiation non-cœur ${filiation.index} à l'index ${nonCoreIndex}: ${chdNum}`);
        }
      } else {
        console.log(`Point ECD ignoré pour filiation cœur ${filiation.index} - passage à la filiation suivante`);
      }

      console.log(`Points de dureté et ECD remplis pour filiation ${filiation.index}`);

      // 4. Traiter les données de courbe
      // Seulement pour les filiations normales (pas les cœurs)
      const shouldProcessCurve = !filiation.isCore;
      
      if (shouldProcessCurve) {
        console.log(`Traitement courbe pour filiation normale ${filiation.index}`);
        console.log(`Indices - distance: ${filiation.distanceIndex}, valeur: ${filiation.hvalueIndex}`);
        
        const columnName = locationName || `Position_${filiation.index}`;

        dataRows.forEach((row, rowIndex) => {
          const distance = row[filiation.distanceIndex];
          const hvalue = row[filiation.hvalueIndex];
          
          if (distance !== undefined && distance !== null && distance !== '' &&
              hvalue !== undefined && hvalue !== null && hvalue !== '' &&
              !distance.toString().startsWith('$') && 
              !hvalue.toString().startsWith('$')) {
              
            const distanceNum = parseFloat(distance.toString().replace(',', '.'));
            const hvalueNum = parseFloat(hvalue.toString().replace(',', '.'));
            
            if (!isNaN(distanceNum) && !isNaN(hvalueNum)) {
              // Arrondir la distance à 3 décimales pour éviter les problèmes de précision flottante
              const roundedDistance = Math.round(distanceNum * 1000) / 1000;

              // Si c'est la filiation de référence pour les distances, créer les points de base
              if (filiation === distanceFiliation) {
                if (!globalCurveDataMap.has(roundedDistance)) {
                  globalCurveDataMap.set(roundedDistance, {
                    distance: roundedDistance
                  });
                }
                
                const pointData = globalCurveDataMap.get(roundedDistance);
                
                // Ajouter la valeur avec tous les formats possibles pour compatibilité
                const normalizedPositionName = normalizePositionName(locationName);
                const hardnessFieldName = `hardness_${normalizedPositionName}`;
                const positionKey = locationName.toLowerCase();
                
                pointData[normalizedPositionName] = hvalueNum;
                pointData[hardnessFieldName] = hvalueNum;
                pointData[positionKey] = hvalueNum;
                pointData[locationName] = hvalueNum; // Nom exact
                
                // Compatibilité avec les noms standards
                if (locationName.toLowerCase().includes('flank') || locationName.toLowerCase().includes('flanc')) {
                  pointData.flankHardness = hvalueNum;
                  pointData.Flank = hvalueNum;
                  pointData.flank = hvalueNum;
                } else if (locationName.toLowerCase().includes('root') || locationName.toLowerCase().includes('pied')) {
                  pointData.rootHardness = hvalueNum;
                  pointData.Root = hvalueNum;
                  pointData.root = hvalueNum;
                }
                
                console.log(`Point courbe créé/mis à jour: distance=${roundedDistance}, ${locationName}=${hvalueNum}`);
              } else {
                // Pour les autres filiations normales, ajouter la valeur HVALUE si la distance existe
                if (globalCurveDataMap.has(roundedDistance)) {
                  const existingPoint = globalCurveDataMap.get(roundedDistance);
                  
                  // Ajouter la valeur avec tous les formats possibles pour compatibilité
                  const normalizedPositionName = normalizePositionName(locationName);
                  const hardnessFieldName = `hardness_${normalizedPositionName}`;
                  const positionKey = locationName.toLowerCase();
                  
                  existingPoint[normalizedPositionName] = hvalueNum;
                  existingPoint[hardnessFieldName] = hvalueNum;
                  existingPoint[positionKey] = hvalueNum;
                  existingPoint[locationName] = hvalueNum; // Nom exact
                  
                  // Compatibilité avec les noms standards
                  if (locationName.toLowerCase().includes('flank') || locationName.toLowerCase().includes('flanc')) {
                    existingPoint.flankHardness = hvalueNum;
                    existingPoint.Flank = hvalueNum;
                    existingPoint.flank = hvalueNum;
                  } else if (locationName.toLowerCase().includes('root') || locationName.toLowerCase().includes('pied')) {
                    existingPoint.rootHardness = hvalueNum;
                    existingPoint.Root = hvalueNum;
                    existingPoint.root = hvalueNum;
                  }
                  
                  console.log(`Valeur HVALUE ajoutée à point existant: distance=${roundedDistance}, ${locationName}=${hvalueNum}`);
                }
              }
            }
          }
        });

        console.log(`Courbe traitée pour filiation normale ${filiation.index}`);
      } else {
        console.log(`Courbe ignorée pour filiation cœur ${filiation.index}`);
      }
    }

    // Délai supplémentaire entre l'étape 2 et 3 pour s'assurer que les colonnes dynamiques sont créées
    console.log('=== ATTENTE ENTRE ÉTAPE 2 ET 3 ===');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Après avoir traité toutes les filiations, ajouter les points de courbe fusionnés
    if (globalCurveDataMap.size > 0) {
      console.log(`=== ÉTAPE 3 : AJOUT DES POINTS DE COURBE FUSIONNÉS ===`);
      console.log(`${globalCurveDataMap.size} points uniques de courbe à ajouter`);
      
      // Convertir la Map en tableau et trier par distance
      const fusedCurveData = Array.from(globalCurveDataMap.values()).sort((a, b) => 
        parseFloat(a.distance) - parseFloat(b.distance)
      );
      
      // Nettoyer et normaliser les données avant l'ajout
      // Correction : ne garder que les clés normalisées des positions ECD
      const ecdPositionNames = nonCoreFilations.map(f => normalizePositionName(dataRows[0][f.locNameIndex]));
      const cleanedCurveData = fusedCurveData.map(point => {
        const cleanedPoint = {
          distance: point.distance
        };
        ecdPositionNames.forEach(posName => {
          if (point[posName] !== undefined && point[posName] !== null && !isNaN(point[posName])) {
            cleanedPoint[posName] = Number(point[posName]);
          }
        });
        return cleanedPoint;
      });
      
      console.log('ÉTAPE 3 - Données fusionnées à ajouter:', cleanedCurveData.slice(0, 3)); // Log des 3 premiers points  
      console.log('ÉTAPE 3 - Clés disponibles dans les données:', Object.keys(cleanedCurveData[0] || {}));
      
      // Attendre un délai pour s'assurer que le composant ResultCurveSection est bien monté
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const curveSectionRef = getCurveSectionRef(resultIndex, sampleIndex);
      console.log(`Tentative d'accès à la référence pour ${resultIndex}-${sampleIndex}:`, curveSectionRef);
      
      if (curveSectionRef && curveSectionRef.current && curveSectionRef.current.addMultipleDataPoints) {
        console.log(`Ajout des points de courbe fusionnés via ResultCurveSection...`);
        curveSectionRef.current.addMultipleDataPoints(cleanedCurveData);
        console.log(`${cleanedCurveData.length} points de courbe fusionnés ajoutés avec succès`);
      } else {
        console.warn(`Référence ResultCurveSection non disponible. Tentative alternative...`);
        
        // Méthode alternative : mettre à jour directement les données via handleChange
        const currentResultsForCurve = [...formData.resultsData.results];
        const currentSampleForCurve = currentResultsForCurve[resultIndex].samples[sampleIndex];
        
        if (!currentSampleForCurve.curveData) {
          currentSampleForCurve.curveData = { points: [] };
        }
        
        // Remplacer les points existants par les nouveaux points fusionnés (structure propre)
        currentSampleForCurve.curveData.points = cleanedCurveData;
        
        handleChange({
          target: {
            name: 'resultsData.results',
            value: currentResultsForCurve
          }
        });
        
        console.log(`${cleanedCurveData.length} points de courbe fusionnés ajoutés en méthode alternative`);
      }
    }

    // Message de succès
    alert(t('tests.after.results.import.success', { count: allFiliations.length }));
  };

  return {
    fileInputRef,
    getCurveSectionRef,
    handleExcelImport,
    processExcelData
  };
};

export default useExcelImport;
