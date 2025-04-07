// src/hooks/useFormHandlers.js
import { useState } from 'react';

const useFormHandlers = (formData, setFormData, errors, setErrors) => {
  // Gestionnaire de base pour les champs simples
  const handleChange = (e) => {
    const { name, value } = e.target;
    
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
        return newData;
      });
    } else {
      // Gestion des propriétés au niveau racine
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Effacer l'erreur si elle existe
    if (errors && errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Gestionnaire pour les sélecteurs (Select components)
  const handleSelectChange = (selectedOption, fieldInfo) => {
    // Support pour différentes API de composants Select (React-Select, etc.)
    const name = typeof fieldInfo === 'string' 
      ? fieldInfo 
      : fieldInfo.name || (fieldInfo.field || null);
      
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
    
    // Effacer l'erreur si elle existe
    if (errors && errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Gestionnaire générique pour les tableaux d'éléments
  const handleArrayAdd = (arrayPath, newItemTemplate) => {
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
  };

  // Gestionnaire générique pour supprimer un élément d'un tableau
  const handleArrayRemove = (arrayPath, index, minItems = 1) => {
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
  };

  return {
    handleChange,
    handleSelectChange,
    handleArrayAdd,
    handleArrayRemove
  };
};

export default useFormHandlers;