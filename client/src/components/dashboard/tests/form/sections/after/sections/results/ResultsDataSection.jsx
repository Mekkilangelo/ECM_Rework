import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Row, Col, Button, Table } from 'react-bootstrap';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faFileImport } from '@fortawesome/free-solid-svg-icons';
import * as XLSX from 'xlsx';
import MicrographsSection from './modules/MicrographsSection';
import ResultCurveSection from './modules/ResultCurveSection';
import ControlLocationSection from './modules/ControlLocationSection';
import CollapsibleSection from '../../../../../../../common/CollapsibleSection/CollapsibleSection';

const ResultsDataSection = ({
  formData,
  parentId,
  handleChange,
  handleSelectChange,
  getSelectedOption,
  lengthUnitOptions,
  hardnessUnitOptions,
  handleResultBlocAdd,
  handleResultBlocRemove,
  handleSampleAdd,
  handleSampleRemove,
  handleHardnessResultAdd,
  handleHardnessResultRemove,
  handleEcdPositionAdd,
  handleEcdPositionRemove,
  handleEcdPositionChange,
  loading,
  selectStyles,
  test,
  handleFileAssociationNeeded,
  viewMode = false,  readOnlyFieldStyle = {}
}) => {
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
  };  // Fonction pour traiter les données Excel pour un échantillon spécifique
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
            ),            chdIndex: firstRow.findIndex(cell => 
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
    }    console.log(`${allFiliations.length} filiations détectées:`, allFiliations);    // Map globale pour fusionner les données de courbe par distance
    const globalCurveDataMap = new Map();    // ÉTAPE 1 : D'abord ajouter tous les points ECD nécessaires pour créer les colonnes dynamiques
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
      );      // Toutes les filiations vont dans le même échantillon
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
      }      // Remplir les champs après un délai pour s'assurer que les éléments DOM sont créés
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

      console.log(`Points de dureté et ECD remplis pour filiation ${filiation.index}`);      // 4. Traiter les données de courbe
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
            const roundedDistance = Math.round(distanceNum * 1000) / 1000;            // Pour la première filiation, créer le point avec la distance
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
      });      console.log(`Courbe traitée pour filiation ${filiation.index}`);

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
      }    }

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

  // Fonctions de gestion des résultats internes au composant
  const handleResultChange = (resultIndex, field, value) => {
    const updatedResults = [...formData.resultsData.results];
    updatedResults[resultIndex] = { ...updatedResults[resultIndex], [field]: value };
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  const handleSampleChange = (resultIndex, sampleIndex, field, value) => {
    const updatedResults = [...formData.resultsData.results];
    updatedResults[resultIndex].samples[sampleIndex] = { 
      ...updatedResults[resultIndex].samples[sampleIndex], 
      [field]: value 
    };
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  const handleHardnessChange = (resultIndex, sampleIndex, hardnessIndex, field, value) => {
    const updatedResults = [...formData.resultsData.results];
    const updatedHardnessPoints = [...updatedResults[resultIndex].samples[sampleIndex].hardnessPoints];
    if (field === 'unit') {
      // Pour les champs select
      updatedHardnessPoints[hardnessIndex] = {
        ...updatedHardnessPoints[hardnessIndex],
        [field]: value ? value.value : ''
      };
    } else {
      // Pour les champs directs
      updatedHardnessPoints[hardnessIndex] = {
        ...updatedHardnessPoints[hardnessIndex],
        [field]: value
      };
    }
    updatedResults[resultIndex].samples[sampleIndex].hardnessPoints = updatedHardnessPoints;
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  const handleEcdChange = (resultIndex, sampleIndex, field, value) => {
    const updatedResults = [...formData.resultsData.results];
    
    // S'assurer que l'objet ecd existe avec toutes ses propriétés
    if (!updatedResults[resultIndex].samples[sampleIndex].ecd) {
      updatedResults[resultIndex].samples[sampleIndex].ecd = {
        hardnessValue: '',
        hardnessUnit: '',
        ecdPoints: [{ name: '', distance: '', unit: '' }]
      };
    }
    
    if (field === 'hardnessUnit') {
      updatedResults[resultIndex].samples[sampleIndex].ecd[field] = value ? value.value : '';
    } else if (field === 'hardnessValue') {
      updatedResults[resultIndex].samples[sampleIndex].ecd[field] = value;
    }
    
    handleChange({
      target: {
        name: 'resultsData.results',
        value: updatedResults
      }
    });
  };

  // S'assurer que le tableau de résultats existe
  const results = formData.resultsData?.results || [];

  return (
    <div>
      <h6 className="mb-3 d-flex justify-content-between align-items-center">
        <span>{t('tests.after.results.resultsLabel')}</span>
        {!viewMode && (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleResultBlocAdd}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.after.results.addResult')}
          </Button>
        )}
      </h6>
      
      {results.map((result, resultIndex) => (
        <CollapsibleSection 
          key={resultIndex} 
          title={t('tests.after.results.resultNumber', { number: result.step })}
          isExpandedByDefault={resultIndex === 0}
          sectionId={`result-section-${resultIndex}`}
          rememberState={true}
          level={0}
          className="mb-3"
        >
          <div className="mb-3 d-flex justify-content-end">
            {!viewMode && results.length > 1 && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleResultBlocRemove(resultIndex)}
                disabled={loading}
              >
                <FontAwesomeIcon icon={faTrash} className="me-1" /> {t('common.delete')}
              </Button>
            )}
          </div>
          
          <Form.Group className="mb-3">
            <Form.Label>{t('tests.after.results.description')}</Form.Label>
            <Form.Control
              type="text"
              value={result.description || ''}
              onChange={(e) => handleResultChange(resultIndex, 'description', e.target.value)}
              disabled={loading || viewMode}
              readOnly={viewMode}
              style={viewMode ? readOnlyFieldStyle : {}}
            />
          </Form.Group>

          {/* Section des échantillons */}
          <div className="mb-3">      <h6 className="mb-3 d-flex justify-content-between align-items-center">
        <span>{t('tests.after.results.samples')}</span>
        <div className="d-flex gap-2">
          {!viewMode && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => handleSampleAdd(resultIndex)}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.after.results.addSample')}
            </Button>
          )}
        </div>
      </h6>

            {result.samples?.map((sample, sampleIndex) => (
              <CollapsibleSection 
                key={sampleIndex} 
                title={t('tests.after.results.sampleNumber', { number: sample.step })}
                isExpandedByDefault={sampleIndex === 0}
                sectionId={`sample-section-${resultIndex}-${sampleIndex}`}
                rememberState={true}
                level={1}
                className="mb-3"
              >
                <div className="mb-3 d-flex justify-content-end">
                  {!viewMode && result.samples.length > 1 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleSampleRemove(resultIndex, sampleIndex)}
                      disabled={loading}
                    >
                      <FontAwesomeIcon icon={faTrash} className="me-1" /> {t('common.delete')}
                    </Button>
                  )}
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>{t('tests.after.results.sampleDescription')}</Form.Label>
                  <Form.Control
                    type="text"
                    value={sample.description || ''}
                    onChange={(e) => handleSampleChange(resultIndex, sampleIndex, 'description', e.target.value)}
                    disabled={loading || viewMode}
                    readOnly={viewMode}
                    style={viewMode ? readOnlyFieldStyle : {}}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">                  <Form.Label className="d-flex justify-content-between align-items-center">
                    <span>{t('tests.after.results.hardness')}</span>
                    <div className="d-flex gap-2">
                      {!viewMode && (
                        <>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                          >
                            <FontAwesomeIcon icon={faFileImport} className="me-1" /> {t('tests.after.results.import.button')}
                          </Button>
                        </>
                      )}
                    </div>
                  </Form.Label>

                  {/* Input file caché pour l'import Excel */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleExcelImport(e, resultIndex, sampleIndex)}
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                  />
                  <Table responsive bordered size="sm" className="mt-2" style={{ overflow: 'visible' }}>
                    <thead className="bg-light">
                      <tr>
                        <th style={{ width: '40%' }}>{t('tests.after.results.position')}</th>
                        <th style={{ width: '25%' }}>{t('tests.after.results.value')}</th>
                        <th style={{ width: '25%' }}>{t('common.unit')}</th>
                        <th style={{ width: '10%' }}>{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sample.hardnessPoints?.map((point, hardnessIndex) => (
                        <tr key={`hardness-${resultIndex}-${sampleIndex}-${hardnessIndex}`}>
                          <td>
                            <Form.Control
                              type="text"
                              value={point.location || ''}
                              onChange={(e) => handleHardnessChange(resultIndex, sampleIndex, hardnessIndex, 'location', e.target.value)}
                              placeholder={t('tests.after.results.enterPosition')}
                              disabled={loading || viewMode}
                              readOnly={viewMode}
                              style={viewMode ? readOnlyFieldStyle : {}}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              value={point.value || ''}
                              onChange={(e) => handleHardnessChange(resultIndex, sampleIndex, hardnessIndex, 'value', e.target.value)}
                              placeholder={t('tests.after.results.enterValue')}
                              disabled={loading || viewMode}
                              readOnly={viewMode}
                              style={viewMode ? readOnlyFieldStyle : {}}
                            />
                          </td>
                          <td>
                            <Select
                              value={getSelectedOption(hardnessUnitOptions, point.unit || formData.resultsData?.hardnessResultUnit)}
                              onChange={(option) => handleHardnessChange(resultIndex, sampleIndex, hardnessIndex, 'unit', option)}
                              options={hardnessUnitOptions}
                              placeholder={t('common.selectUnit')}
                              isDisabled={loading || viewMode}
                              menuPortalTarget={document.body}
                              styles={{
                                ...selectStyles,
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                ...(viewMode ? {
                                  control: (provided) => ({
                                    ...provided,
                                    ...readOnlyFieldStyle,
                                    cursor: 'default'
                                  }),
                                  dropdownIndicator: () => ({ display: 'none' }),
                                  indicatorSeparator: () => ({ display: 'none' })
                                } : {})
                              }}
                              isClearable={!viewMode}
                            />
                          </td>
                          <td className="text-center">
                            {!viewMode && sample.hardnessPoints.length > 1 ? (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleHardnessResultRemove(resultIndex, sampleIndex, hardnessIndex)}
                                disabled={loading}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <div className="text-end mt-2">
                    {!viewMode && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleHardnessResultAdd(resultIndex, sampleIndex)}
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.after.results.addPoint')}
                      </Button>
                    )}
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>{t('tests.after.results.ecd')}</Form.Label>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>{t('tests.after.results.hardness')}</Form.Label>
                        <Form.Control
                          type="number"
                          value={sample.ecd?.hardnessValue || ''}
                          onChange={(e) => handleEcdChange(resultIndex, sampleIndex, 'hardnessValue', e.target.value)}
                          placeholder={t('tests.after.results.hardnessValue')}
                          disabled={loading}
                          readOnly={viewMode}
                          style={viewMode ? readOnlyFieldStyle : {}}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>{t('common.unit')}</Form.Label>
                        <Select
                          value={getSelectedOption(hardnessUnitOptions, sample.ecd?.hardnessUnit)}
                          onChange={(option) => handleEcdChange(resultIndex, sampleIndex, 'hardnessUnit', option)}
                          options={hardnessUnitOptions}
                          placeholder={t('tests.after.results.hardnessUnit')}
                          isDisabled={loading || viewMode}
                          styles={{
                            ...selectStyles,
                            ...(viewMode ? {
                              control: (provided) => ({
                                ...provided,
                                ...readOnlyFieldStyle,
                                cursor: 'default'
                              }),
                              dropdownIndicator: () => ({ display: 'none' }),
                              indicatorSeparator: () => ({ display: 'none' })
                            } : {})
                          }}
                          isClearable={!viewMode}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Table responsive bordered size="sm" className="mt-2" style={{ overflow: 'visible' }}>
                    <thead className="bg-light">
                      <tr>
                        <th style={{ width: '35%' }}>{t('tests.after.results.position')}</th>
                        <th style={{ width: '25%' }}>{t('tests.after.results.distance')}</th>
                        <th style={{ width: '25%' }}>{t('common.unit')}</th>
                        <th style={{ width: '15%' }}>{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sample.ecd?.ecdPoints?.map((point, positionIndex) => (
                        <tr key={`ecd-position-${resultIndex}-${sampleIndex}-${positionIndex}`}>
                          <td>
                            <Form.Control
                              type="text"
                              value={point.name || ''}
                              onChange={(e) => handleEcdPositionChange(resultIndex, sampleIndex, positionIndex, 'name', e.target.value)}
                              placeholder={t('tests.after.results.enterPosition')}
                              disabled={loading || viewMode}
                              readOnly={viewMode}
                              style={viewMode ? readOnlyFieldStyle : {}}
                            />
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              value={point.distance || ''}
                              onChange={(e) => handleEcdPositionChange(resultIndex, sampleIndex, positionIndex, 'distance', e.target.value)}
                              placeholder={t('tests.after.results.enterDistance')}
                              disabled={loading}
                              readOnly={viewMode}
                              style={viewMode ? readOnlyFieldStyle : {}}
                            />
                          </td>
                          <td>
                            <Select
                              value={point.unit 
                                ? getSelectedOption(lengthUnitOptions, point.unit) 
                                : lengthUnitOptions[0] || null}
                              onChange={(option) => handleEcdPositionChange(resultIndex, sampleIndex, positionIndex, 'unit', option)}
                              options={lengthUnitOptions}
                              placeholder={t('common.selectUnit')}
                              isDisabled={loading || viewMode}
                              menuPortalTarget={document.body}
                              styles={{
                                ...selectStyles,
                                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                ...(viewMode ? {
                                  control: (provided) => ({
                                    ...provided,
                                    ...readOnlyFieldStyle,
                                    cursor: 'default'
                                  }),
                                  dropdownIndicator: () => ({ display: 'none' }),
                                  indicatorSeparator: () => ({ display: 'none' })
                                } : {})
                              }}
                              isClearable={!viewMode}
                            />
                          </td>
                          <td className="text-center">
                            {!viewMode && sample.ecd?.ecdPoints?.length > 1 ? (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleEcdPositionRemove(resultIndex, sampleIndex, positionIndex)}
                                disabled={loading}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <div className="text-end mt-2">
                    {!viewMode && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleEcdPositionAdd(resultIndex, sampleIndex)}
                        disabled={loading}
                      >
                        <FontAwesomeIcon icon={faPlus} className="me-1" /> {t('tests.after.results.addPoint')}
                      </Button>
                    )}
                  </div>
                </Form.Group>

                <CollapsibleSection
                  title={t('tests.after.results.resultCurve.title')}
                  isExpandedByDefault={false}
                  sectionId={`test-hardness-curve-${resultIndex}-${sampleIndex}`}
                  rememberState={true}
                  level={2}
                  className="mb-3"
                >                  <ResultCurveSection
                    ref={getCurveSectionRef(resultIndex, sampleIndex)}
                    result={sample}
                    resultIndex={resultIndex}
                    sampleIndex={sampleIndex}
                    handleChange={handleChange}
                    handleSelectChange={handleSelectChange}
                    getSelectedOption={getSelectedOption}
                    hardnessUnitOptions={hardnessUnitOptions}
                    loading={loading}
                    selectStyles={selectStyles}
                    test={test}
                    formData={formData}
                    parentId={parentId}
                    viewMode={viewMode}
                    readOnlyFieldStyle={readOnlyFieldStyle}
                  />
                </CollapsibleSection>
                
                <CollapsibleSection
                  title={t('tests.after.results.controlLocation.title')}
                  isExpandedByDefault={false}
                  sectionId={`test-control-location-${resultIndex}-${sampleIndex}`}
                  rememberState={true}
                  level={2}
                  className="mb-3"
                >
                  <ControlLocationSection
                    testNodeId={test ? test.id : null}
                    resultIndex={resultIndex}
                    sampleIndex={sampleIndex}
                    onFileAssociationNeeded={handleFileAssociationNeeded}
                    viewMode={viewMode}
                  />
                </CollapsibleSection>
                
                <CollapsibleSection
                  title={t('tests.after.results.micrographs.title')}
                  isExpandedByDefault={false}
                  sectionId={`test-micrographs-${resultIndex}-${sampleIndex}`}
                  rememberState={true}
                  level={2}
                >  
                  <MicrographsSection
                    testNodeId={test ? test.id : null}
                    resultIndex={resultIndex}
                    sampleIndex={sampleIndex}
                    onFileAssociationNeeded={handleFileAssociationNeeded}
                    viewMode={viewMode}
                  />
                </CollapsibleSection>
              </CollapsibleSection>
            ))}
          </div>
        </CollapsibleSection>
      ))}
    </div>
  );
};

export default ResultsDataSection;
