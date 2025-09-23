// src/hooks/useFormHandlers.js
import { useCallback } from 'react';
import enumService from '../services/enumService';

const useFormHandlers = (formData, setFormData, errors, setErrors, refreshOptionsFunctions = {}, setModified = null) => {
  
  // Fonction utilitaire pour marquer le formulaire comme modifié
  const markAsModified = useCallback(() => {
    console.log('🔄 markAsModified called in useFormHandlers');
    if (setModified) {
      setModified(true);
    }
  }, [setModified]);

  // Gestionnaire de base pour les champs simples
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Debug : tracer les mises à jour des données curve et resultsData
    if (process.env.NODE_ENV === 'development' && (name === 'resultsData' || (name && name.includes('curveData')))) {
      console.log('🔧 useFormHandlers - handleChange reçu:', {
        fieldName: name,
        valueType: typeof value,
        isResultsData: name === 'resultsData',
        isCurveData: name && name.includes('curveData'),
        hasValue: !!value
      });
      
      if (name === 'resultsData' && value) {
        console.log('📊 Analyse des données resultsData reçues:', {
          hasResults: !!value.results,
          resultsCount: value.results?.length || 0,
          firstResultSamples: value.results?.[0]?.samples?.length || 0
        });
        
        // Vérifier les curveData dans chaque sample
        if (value.results) {
          value.results.forEach((result, rIndex) => {
            if (result.samples) {
              result.samples.forEach((sample, sIndex) => {
                if (sample.curveData) {
                  console.log(`📈 CurveData trouvée [${rIndex}][${sIndex}]:`, {
                    hasDistances: !!sample.curveData.distances,
                    hasSeries: !!sample.curveData.series,
                    hasPoints: !!sample.curveData.points,
                    distancesCount: sample.curveData.distances?.length || 0,
                    seriesCount: sample.curveData.series?.length || 0,
                    pointsCount: sample.curveData.points?.length || 0
                  });
                }
              });
            }
          });
        }
      }
    }
    
    // Gestion des propriétés imbriquées (avec notation par point)
    if (name.includes('.')) {
      const parts = name.split('.');
      setFormData(prevData => {
        const newData = { ...prevData };
        let current = newData;
        
        // Navigue dans l'objet jusqu'au dernier niveau
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        // Définit la valeur à la propriété finale
        current[parts[parts.length - 1]] = value;
        
        // Debug : vérifier que les données curve ont été mises à jour
        if (process.env.NODE_ENV === 'development' && name && name.includes('curveData')) {
          console.log('=== VERIFICATION APRES MISE A JOUR ===');
          console.log('Updated path:', parts.join('.'));
          console.log('Final value set:', current[parts[parts.length - 1]]);
          console.log('Full data structure at update point:', newData);
          
          // FORCER UN NOUVEAU RENDU POUR LES DONNEES DE COURBE
          console.log('=== FORCING DEEP CLONE FOR CURVE DATA ===');
          console.log('Creating new reference for resultsData to force re-render...');
        }
        
        // Pour les données de courbe, forcer un deep clone pour garantir le re-render
        if (name && name.includes('curveData')) {
          return JSON.parse(JSON.stringify(newData));
        }
        
        return newData;
      });
    } else {
      // Gestion des propriétés au niveau racine
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Marquer le formulaire comme modifié
    markAsModified();
    
    // Effacer l'erreur si elle existe
    if (errors && errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [setFormData, errors, setErrors, markAsModified]);

  // Gestionnaire pour les sélecteurs (Select components)
  const handleSelectChange = useCallback((selectedOption, fieldInfo) => {
    // Support pour différentes API de composants Select (React-Select, etc.)
    const name = typeof fieldInfo === 'string' 
      ? fieldInfo 
      : (fieldInfo.name || fieldInfo.field || null);
      
    if (!name) return;
    
    const value = selectedOption ? selectedOption.value : null;
    
    // Gestion des propriétés imbriquées
    if (name.includes('.')) {
      const parts = name.split('.');
      setFormData(prevData => {
        const newData = { ...prevData };
        let current = newData;
        
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        current[parts[parts.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Marquer le formulaire comme modifié
    markAsModified();
    
    // Effacer l'erreur si elle existe
    if (errors && errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [setFormData, errors, setErrors, markAsModified]);

  // Gestionnaire pour les tableaux d'objets imbriqués (structure plus complexe)
  const handleNestedArraySelectChange = useCallback((option, field, index, subField) => {
    const value = option ? option.value : '';
    
    // Pour les tableaux d'objets imbriqués (e.g., equivalents ou chemical_elements)
    const items = [...formData[field]];
    items[index] = {
      ...items[index],
      [subField]: value
    };
    
    setFormData({
      ...formData,
      [field]: items
    });
    
  }, [formData, setFormData]);

  // Gestionnaire générique pour les tableaux d'éléments
  const handleArrayAdd = useCallback((arrayPath, newItemTemplate) => {
    setFormData(prev => {
      // Gestion des chemins imbriqués
      if (arrayPath.includes('.')) {
        const parts = arrayPath.split('.');
        const newData = { ...prev };
        let current = newData;
        
        // Navigation jusqu'à l'avant-dernier niveau
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        const finalKey = parts[parts.length - 1];
        const array = current[finalKey] || [];
        
        // Ajouter le nouvel élément
        current[finalKey] = [...array, newItemTemplate(array.length)];
        return newData;
      }
      
      // Cas simple sans imbrication
      const array = prev[arrayPath] || [];
      return { ...prev, [arrayPath]: [...array, newItemTemplate(array.length)] };
    });
  }, [setFormData]);

  // Gestionnaire générique pour supprimer un élément d'un tableau
  const handleArrayRemove = useCallback((arrayPath, index, minItems = 1) => {
    setFormData(prev => {
      // Obtenir le tableau actuel (gérer les chemins imbriqués)
      let array;
      let setFunction;
      
      if (arrayPath.includes('.')) {
        const parts = arrayPath.split('.');
        const newData = { ...prev };
        let current = newData;
        
        // Navigation jusqu'à l'avant-dernier niveau
        for (let i = 0; i < parts.length - 1; i++) {
          if (!current[parts[i]]) {
            current[parts[i]] = {};
          }
          current = current[parts[i]];
        }
        
        const finalKey = parts[parts.length - 1];
        array = current[finalKey];
        
        // Fonction pour mettre à jour le tableau imbriqué
        setFunction = (updatedArray) => {
          current[finalKey] = updatedArray;
          return newData;
        };
      } else {
        array = prev[arrayPath];
        
        // Fonction pour mettre à jour le tableau au niveau racine
        setFunction = (updatedArray) => ({ ...prev, [arrayPath]: updatedArray });
      }
      
      // Vérifier qu'il y a plus d'éléments que le minimum requis
      if (array && array.length > minItems) {
        const updatedArray = array.filter((_, i) => i !== index);
        
        // Recalculer les indices si nécessaire (si les éléments ont une propriété "step")
        if (updatedArray.length > 0 && 'step' in updatedArray[0]) {
          updatedArray.forEach((item, i) => {
            item.step = i + 1;
          });
        }
        
        return setFunction(updatedArray);
      }
      
      return prev;
    });
  }, [setFormData]);

  // Fonction pour créer une nouvelle option dans un select
  const handleCreateOption = useCallback(async (inputValue, fieldName, tableName, columnName) => {
    try {
      console.log('Creating new option for', fieldName, 'in', tableName, columnName);
      console.log('Available refresh functions:', Object.keys(refreshOptionsFunctions));
      
      // Préparer la fonction de rafraîchissement basée sur le nom du champ
      let refreshFunction;
      
      if (refreshOptionsFunctions) {
        // Essayer différentes conventions de nommage pour trouver la fonction appropriée
        if (tableName === 'units') {
          refreshFunction = refreshOptionsFunctions.refreshUnitOptions;
        } else if (tableName === 'parts' && columnName === 'designation') {
          refreshFunction = refreshOptionsFunctions.refreshDesignationOptions;
        } else if (refreshOptionsFunctions[`refresh${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Options`]) {
          refreshFunction = refreshOptionsFunctions[`refresh${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Options`];
        } else if (refreshOptionsFunctions[`refresh${tableName.charAt(0).toUpperCase() + tableName.slice(1)}Options`]) {
          refreshFunction = refreshOptionsFunctions[`refresh${tableName.charAt(0).toUpperCase() + tableName.slice(1)}Options`];
        } else if (refreshOptionsFunctions.refreshAllOptions) {
          refreshFunction = refreshOptionsFunctions.refreshAllOptions;
        }
      }
      
      // Appeler l'API pour ajouter la nouvelle valeur d'énumération
      const response = await enumService.addEnumValue(tableName, columnName, inputValue);
      
      if (response && response.success) {
        // Mettre à jour le formulaire avec la nouvelle valeur
        setFormData(prev => ({ ...prev, [fieldName]: inputValue }));
        
        // Rafraîchir les options si une fonction est disponible
        if (refreshFunction && typeof refreshFunction === 'function') {
          console.log(`Refreshing options with function:`, refreshFunction.name || 'anonymous');
          await refreshFunction();
        } else {
          console.warn(`No refresh function found for field ${fieldName}, table ${tableName}, column ${columnName}`);
          
          // Essayer de rafraîchir toutes les options disponibles si aucune fonction spécifique n'est trouvée
          const refreshFnKeys = Object.keys(refreshOptionsFunctions).filter(key => key.startsWith('refresh') && typeof refreshOptionsFunctions[key] === 'function');
          
          if (refreshFnKeys.length > 0) {
            console.log('Trying fallback refresh with:', refreshFnKeys[0]);
            await refreshOptionsFunctions[refreshFnKeys[0]]();
          }
        }
        
        return { value: inputValue, label: inputValue };
      } else {
        console.error(`Erreur lors de l'ajout de ${fieldName}:`, response);
        return null;
      }
    } catch (error) {
      console.error(`Erreur lors de l'ajout de ${fieldName}:`, error);
      return null;
    }
  }, [setFormData, refreshOptionsFunctions]);

  return {
    handleChange,
    handleSelectChange,
    handleNestedArraySelectChange,
    handleArrayAdd,
    handleArrayRemove,
    handleCreateOption
  };
};

export default useFormHandlers;