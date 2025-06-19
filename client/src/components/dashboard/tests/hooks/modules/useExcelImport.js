import React, { useRef, useState } from 'react';
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
  
  // Créer des refs pour chaque ResultCurveSection
  const [curveSectionRefs, setCurveSectionRefs] = useState({});

  // Obtenir ou créer une ref pour un ResultCurveSection spécifique
  const getCurveSectionRef = (resultIndex, sampleIndex) => {
    const key = `${resultIndex}-${sampleIndex}`;
    if (!curveSectionRefs[key]) {
      curveSectionRefs[key] = React.createRef();
      setCurveSectionRefs({...curveSectionRefs, [key]: curveSectionRefs[key]});
    }
    return curveSectionRefs[key];
  };

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
  };

  // Fonction pour traiter les données Excel pour un échantillon spécifique
  const processExcelData = async (data, resultIndex, sampleIndex) => {
    if (!data || data.length === 0) return;

    console.log('=== ANALYSE FICHIER EXCEL ===');
    console.log(`Import pour résultat ${resultIndex}, échantillon ${sampleIndex}`);

    const firstRow = data[0];
    const dataRows = data.slice(1);
    
    // Analyser toutes les filiations présentes
    const allFiliations = [];
    
    // Chercher d'abord les filiations directes (colonnes 0-8 et 9-17)
    if (firstRow[0] && typeof firstRow[0] === 'string' && !firstRow[0].startsWith('$')) {
      console.log('Filiation 1 (directe) détectée');
      allFiliations.push({
        index: 1,
        locNameIndex: 0,
        surfHvalIndex: 1,
        chdIndex: 2,
        baseIndex: 4,
        distanceIndex: 5,
        hvalueIndex: 6,
        hscaleIndex: 7,
        isDirect: true
      });
    }
    
    if (firstRow[9] && typeof firstRow[9] === 'string' && !firstRow[9].startsWith('$')) {
      console.log('Filiation 2 (directe) détectée');
      allFiliations.push({
        index: 2,
        locNameIndex: 9,
        surfHvalIndex: 10,
        chdIndex: 11,
        baseIndex: 13,
        distanceIndex: 14,
        hvalueIndex: 15,
        hscaleIndex: 16,
        isDirect: true
      });
    }

    // Chercher les filiations avec marqueurs (1-7)
    for (let i = 1; i <= 7; i++) {
      const locNameIndex = firstRow.findIndex(cell => 
        cell && cell.toString().includes(`$LOCNAME.L(${i})`)
      );
      
      if (locNameIndex !== -1) {
        const hasData = dataRows.some(row => 
          row[locNameIndex] && 
          row[locNameIndex] !== '' && 
          !row[locNameIndex].toString().startsWith('$')
        );
        
        if (hasData) {
          allFiliations.push({
            index: i,
            locNameIndex,
            surfHvalIndex: firstRow.findIndex(cell => 
              cell && cell.toString().includes(`$STAT.SURFHVAL.L(${i})`)
            ),
            chdIndex: firstRow.findIndex(cell => 
              cell && (cell.toString().includes(`$STAT.CHD${i}.L(${i})`) || cell.toString().includes(`$STAT.CHD1.L(${i})`))
            ),
            baseIndex: firstRow.findIndex(cell => 
              cell && cell.toString().includes(`$STAT.BASE1.L(${i})`)
            ),
            distanceIndex: firstRow.findIndex(cell => 
              cell && cell.toString().includes(`$DISTANCE.L(${i})`)
            ),
            hvalueIndex: firstRow.findIndex(cell => 
              cell && cell.toString().includes(`$HVALUE.L(${i})`)
            ),
            hscaleIndex: firstRow.findIndex(cell => 
              cell && cell.toString().includes(`$HSCALE.L(${i})`)
            ),
            isDirect: false
          });
        }
      }
    }

    if (allFiliations.length === 0) {
      alert(t('tests.after.results.import.noData'));
      return;
    }

    console.log(`${allFiliations.length} filiations détectées:`, allFiliations);

    // Map globale pour fusionner les données de courbe par distance
    const globalCurveDataMap = new Map();

    // ÉTAPE 1 : D'abord ajouter tous les points ECD nécessaires pour créer les colonnes dynamiques
    console.log('=== ÉTAPE 1 : CRÉATION DES POINTS ECD ===');
    for (let filiationIndex = 0; filiationIndex < allFiliations.length; filiationIndex++) {
      const filiation = allFiliations[filiationIndex];
      
      // Extraire le nom de la position pour cette filiation
      let locationName;
      if (filiation.isDirect) {
        locationName = firstRow[filiation.locNameIndex];
      } else {
        const firstDataRow = dataRows[0];
        locationName = firstDataRow[filiation.locNameIndex];
      }
      
      console.log(`ÉTAPE 1 - Ajout point ECD pour filiation ${filiation.index}: ${locationName}`);
      
      // Ajouter un point ECD pour chaque filiation (sauf la première qui utilise les points existants)
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
    console.log('ÉTAPE 1 - Terminée, colonnes dynamiques normalement créées');

    // Traiter chaque filiation
    for (let filiationIndex = 0; filiationIndex < allFiliations.length; filiationIndex++) {
      const filiation = allFiliations[filiationIndex];
      console.log(`=== TRAITEMENT FILIATION ${filiation.index} ===`);

      // Extraire les données de base
      let locationName, surfHval, chd, base, hscale;
      
      if (filiation.isDirect) {
        locationName = firstRow[filiation.locNameIndex];
        surfHval = firstRow[filiation.surfHvalIndex];
        chd = firstRow[filiation.chdIndex];
        base = firstRow[filiation.baseIndex];
        hscale = firstRow[filiation.hscaleIndex];
      } else {
        const firstDataRow = dataRows[0];
        locationName = firstDataRow[filiation.locNameIndex];
        surfHval = firstDataRow[filiation.surfHvalIndex];
        chd = firstDataRow[filiation.chdIndex];
        base = firstDataRow[filiation.baseIndex];
        hscale = firstDataRow[filiation.hscaleIndex];
      }

      console.log(`Filiation ${filiation.index} - Données extraites:`, { locationName, surfHval, chd, base, hscale });

      // Convertir les valeurs numériques
      const surfHvalNum = surfHval ? parseFloat(surfHval.toString().replace(',', '.')) : '';
      const chdNum = chd ? parseFloat(chd.toString().replace(',', '.')) : '';
      const baseNum = base ? parseFloat(base.toString().replace(',', '.')) : '';

      // Trouver l'option correspondante dans hardnessUnitOptions
      const unitOption = hardnessUnitOptions.find(option => 
        option.label === hscale || option.value === hscale
      );

      // Toutes les filiations vont dans le même échantillon
      let targetResultIndex = resultIndex;
      let targetSampleIndex = sampleIndex;
      
      // Délai pour permettre la mise à jour des éléments DOM
      await new Promise(resolve => setTimeout(resolve, 200 * (filiationIndex + 1)));

      // Ajouter des points de dureté pour chaque filiation (sauf la première qui utilise les points existants)
      if (filiationIndex > 0) {
        // Ajouter un point de dureté pour les filiations suivantes
        console.log(`Ajout point de dureté pour filiation ${filiation.index}...`);
        handleHardnessResultAdd(targetResultIndex, targetSampleIndex);
        
        // Délai pour s'assurer que les éléments DOM sont créés
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Remplir les champs après un délai pour s'assurer que les éléments DOM sont créés
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const currentResults = [...formData.resultsData.results];
      const currentSample = currentResults[targetResultIndex].samples[targetSampleIndex];
      
      let hardnessPointIndex, ecdPointIndex;
      
      if (filiationIndex === 0) {
        // Pour la première filiation, utiliser le premier point existant (index 0)
        hardnessPointIndex = 0;
        ecdPointIndex = 0;
      } else {
        // Pour les filiations suivantes, utiliser le point correspondant à l'index de filiation
        hardnessPointIndex = filiationIndex;
        ecdPointIndex = filiationIndex;
        
        // S'assurer que les points existent
        if (hardnessPointIndex >= currentSample.hardnessPoints.length) {
          hardnessPointIndex = currentSample.hardnessPoints.length - 1;
        }
        if (ecdPointIndex >= currentSample.ecd.ecdPoints.length) {
          ecdPointIndex = currentSample.ecd.ecdPoints.length - 1;
        }
      }
      
      console.log(`Filiation ${filiation.index} - Using hardnessPointIndex: ${hardnessPointIndex}, ecdPointIndex: ${ecdPointIndex}`);
      
      // Remplir le point de dureté
      handleHardnessChange(targetResultIndex, targetSampleIndex, hardnessPointIndex, 'location', locationName || '');
      handleHardnessChange(targetResultIndex, targetSampleIndex, hardnessPointIndex, 'value', surfHvalNum || '');
      handleHardnessChange(targetResultIndex, targetSampleIndex, hardnessPointIndex, 'unit', unitOption || null);

      // Remplir les données ECD générales (une seule fois pour la première filiation)
      if (filiationIndex === 0) {
        handleEcdChange(targetResultIndex, targetSampleIndex, 'hardnessValue', baseNum || '');
        handleEcdChange(targetResultIndex, targetSampleIndex, 'hardnessUnit', unitOption || null);
      }
      
      // Remplir le point ECD spécifique (le nom a déjà été rempli lors de la création)
      if (chdNum) {
        handleEcdPositionChange(targetResultIndex, targetSampleIndex, ecdPointIndex, 'distance', chdNum.toString());
      }

      console.log(`Points de dureté et ECD remplis pour filiation ${filiation.index}`);

      // 4. Traiter les données de courbe
      console.log(`Traitement courbe pour filiation ${filiation.index}`);
      console.log(`Indices - distance: ${filiation.distanceIndex}, valeur: ${filiation.hvalueIndex}`);
      const curveData = [];
      const columnName = locationName || `Position_${filiation.index}`;

      // Pour les filiations directes, traiter toutes les lignes (y compris la première)
      // Pour les filiations avec marqueurs, traiter seulement les lignes de données
      const rowsToProcess = filiation.isDirect ? data : dataRows;
      
      console.log(`Filiation ${filiation.index} (${filiation.isDirect ? 'directe' : 'avec marqueurs'})`);
      console.log(`Nombre de lignes à traiter: ${rowsToProcess.length}`);
      
      rowsToProcess.forEach((row, rowIndex) => {
        const distance = row[filiation.distanceIndex];
        const hvalue = row[filiation.hvalueIndex];
        
        console.log(`Ligne ${rowIndex}: distance=${distance}, hvalue=${hvalue}`);
        
        if (distance !== undefined && distance !== null && distance !== '' &&
            hvalue !== undefined && hvalue !== null && hvalue !== '' &&
            !distance.toString().startsWith('$') && 
            !hvalue.toString().startsWith('$')) {
            
          const distanceNum = parseFloat(distance.toString().replace(',', '.'));
          const hvalueNum = parseFloat(hvalue.toString().replace(',', '.'));
          
          console.log(`  -> Valeurs converties: distance=${distanceNum}, hvalue=${hvalueNum}`);
          
          if (!isNaN(distanceNum) && !isNaN(hvalueNum)) {
            // Arrondir la distance à 3 décimales pour éviter les problèmes de précision flottante
            const roundedDistance = Math.round(distanceNum * 1000) / 1000;

            // Pour la première filiation, créer le point avec la distance
            if (filiationIndex === 0) {
              const pointData = {
                distance: roundedDistance
              };
              
              // Ajouter la valeur selon le nom de la position
              if (locationName) {
                pointData[locationName] = hvalueNum;
                
                // Compatibilité avec les noms standards
                if (locationName.toLowerCase().includes('flank') || locationName.toLowerCase().includes('flanc')) {
                  pointData.flankHardness = hvalueNum;
                  pointData.Flank = hvalueNum;
                } else if (locationName.toLowerCase().includes('root') || locationName.toLowerCase().includes('pied')) {
                  pointData.rootHardness = hvalueNum;
                  pointData.Root = hvalueNum;
                }
              }
              
              // Ajouter ce point à la Map globale
              globalCurveDataMap.set(roundedDistance, pointData);
              
              console.log(`Point courbe créé pour première filiation: distance=${roundedDistance}, ${locationName}=${hvalueNum}`);
            } else {
              // Pour les filiations suivantes, ajouter uniquement la valeur si la distance existe
              if (globalCurveDataMap.has(roundedDistance)) {
                const existingPoint = globalCurveDataMap.get(roundedDistance);
                
                if (locationName) {
                  existingPoint[locationName] = hvalueNum;
                  
                  // Compatibilité avec les noms standards
                  if (locationName.toLowerCase().includes('flank') || locationName.toLowerCase().includes('flanc')) {
                    existingPoint.flankHardness = hvalueNum;
                    existingPoint.Flank = hvalueNum;
                  } else if (locationName.toLowerCase().includes('root') || locationName.toLowerCase().includes('pied')) {
                    existingPoint.rootHardness = hvalueNum;
                    existingPoint.Root = hvalueNum;
                  }
                }
                
                console.log(`Valeur ajoutée à point existant: distance=${roundedDistance}, ${locationName}=${hvalueNum}`);
              } else {
                console.warn(`Distance ${roundedDistance} non trouvée dans première filiation - valeur ignorée`);
              }
            }
          }
        }
      });

      console.log(`Courbe traitée pour filiation ${filiation.index}`);

      // Ajouter les points de courbe via le ResultCurveSection
      if (curveData.length > 0) {
        // Attendre un délai supplémentaire pour s'assurer que le composant ResultCurveSection est bien monté
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const curveSectionRef = getCurveSectionRef(targetResultIndex, targetSampleIndex);
        console.log(`Tentative d'accès à la référence pour ${targetResultIndex}-${targetSampleIndex}:`, curveSectionRef);
        
        if (curveSectionRef && curveSectionRef.current && curveSectionRef.current.addMultipleDataPoints) {
          console.log(`Ajout des points de courbe via ResultCurveSection pour filiation ${filiation.index}...`);
          curveSectionRef.current.addMultipleDataPoints(curveData);
        } else {
          console.warn(`Référence ResultCurveSection non disponible pour filiation ${filiation.index}. Tentative alternative...`);
          // Méthode alternative : mettre à jour directement les données via handleChange
          const currentResultsForCurve = [...formData.resultsData.results];
          const currentSampleForCurve = currentResultsForCurve[targetResultIndex].samples[targetSampleIndex];
          
          if (!currentSampleForCurve.curveData) {
            currentSampleForCurve.curveData = { points: [] };
          }
          
          // Fusionner les nouveaux points avec les existants
          const existingPoints = currentSampleForCurve.curveData.points || [];
          
          // Pour chaque point de courbe, fusionner avec les points existants ayant la même distance
          curveData.forEach(newPoint => {
            const existingPointIndex = existingPoints.findIndex(
              p => parseFloat(p.distance) === parseFloat(newPoint.distance)
            );
            
            if (existingPointIndex !== -1) {
              // Point existant trouvé, fusionner les données
              existingPoints[existingPointIndex] = {
                ...existingPoints[existingPointIndex],
                ...newPoint
              };
            } else {
              // Nouveau point, l'ajouter
              existingPoints.push(newPoint);
            }
          });
          
          // Trier par distance
          const sortedPoints = existingPoints.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
          
          currentSampleForCurve.curveData.points = sortedPoints;
          
          handleChange({
            target: {
              name: 'resultsData.results',
              value: currentResultsForCurve
            }
          });
          
          console.log(`Points de courbe fusionnés pour filiation ${filiation.index}:`, sortedPoints.length);
        }
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
      
      console.log('ÉTAPE 3 - Données fusionnées à ajouter:', fusedCurveData.slice(0, 3)); // Log des 3 premiers points  
      console.log('ÉTAPE 3 - Clés disponibles dans les données:', Object.keys(fusedCurveData[0] || {}));
      
      // Attendre un délai pour s'assurer que le composant ResultCurveSection est bien monté
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const curveSectionRef = getCurveSectionRef(resultIndex, sampleIndex);
      console.log(`Tentative d'accès à la référence pour ${resultIndex}-${sampleIndex}:`, curveSectionRef);
      
      if (curveSectionRef && curveSectionRef.current && curveSectionRef.current.addMultipleDataPoints) {
        console.log(`Ajout des points de courbe fusionnés via ResultCurveSection...`);
        curveSectionRef.current.addMultipleDataPoints(fusedCurveData);
        console.log(`${fusedCurveData.length} points de courbe fusionnés ajoutés avec succès`);
      } else {
        console.warn(`Référence ResultCurveSection non disponible. Tentative alternative...`);
        
        // Méthode alternative : mettre à jour directement les données via handleChange
        const currentResultsForCurve = [...formData.resultsData.results];
        const currentSampleForCurve = currentResultsForCurve[resultIndex].samples[sampleIndex];
        
        if (!currentSampleForCurve.curveData) {
          currentSampleForCurve.curveData = { points: [] };
        }
        
        // Remplacer les points existants par les nouveaux points fusionnés
        currentSampleForCurve.curveData.points = fusedCurveData;
        
        handleChange({
          target: {
            name: 'resultsData.results',
            value: currentResultsForCurve
          }
        });
        
        console.log(`${fusedCurveData.length} points de courbe fusionnés ajoutés en méthode alternative`);
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
