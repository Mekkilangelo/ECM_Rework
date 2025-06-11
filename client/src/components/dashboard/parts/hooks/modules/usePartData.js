import { useEffect } from 'react';
import partService from '../../../../../services/partService';

/**
 * Hook pour récupérer et formater les données d'une pièce
 * @param {Object} part - La pièce à récupérer et formater
 * @param {Function} setFormData - Fonction pour mettre à jour les données du formulaire
 * @param {Function} setMessage - Fonction pour définir les messages d'erreur/succès
 * @param {Function} setFetchingPart - Fonction pour indiquer l'état de chargement
 * @param {Function} setParentId - Fonction pour définir l'ID de la commande parente
 */
const usePartData = (part, setFormData, setMessage, setFetchingPart, setParentId) => {  
  useEffect(() => {
    if (part && part.id) {
      const fetchPartDetails = async () => {
        setFetchingPart(true);
        try {
          // Utilisation du service refactorisé
          const partData = await partService.getPart(part.id);
            console.log('Raw part data received from API:', partData);
          
          // Vérifier si les données sont dans la propriété Part ou directement dans partData
          const data = partData.Part || partData;
          
          // S'assurer que dimensions et specifications sont des objets et non des chaînes
          let dimensions = {};
          try {
            dimensions = typeof data.dimensions === 'string' 
              ? JSON.parse(data.dimensions) 
              : (data.dimensions || {});
          } catch (err) {
            console.error('Error parsing dimensions:', err);
            dimensions = {};
          }
            
          let specifications = {};
          try {
            specifications = typeof data.specifications === 'string' 
              ? JSON.parse(data.specifications) 
              : (data.specifications || {});
          } catch (err) {
            console.error('Error parsing specifications:', err);
            specifications = {};
          }// Parser les spécifications de dureté dynamiques
          let hardnessSpecs = [];
          if (specifications.hardnessSpecs && Array.isArray(specifications.hardnessSpecs)) {
            hardnessSpecs = specifications.hardnessSpecs.map((spec) => ({
              name: spec.name || '',
              min: spec.min || '',
              max: spec.max || '',
              unit: spec.unit || ''
            }));
          } else {
            // Migration des anciennes spécifications vers le nouveau format
            const legacySpecs = [];
            if (specifications.coreHardness && (specifications.coreHardness.min || specifications.coreHardness.max)) {
              legacySpecs.push({
                name: 'Core',
                min: specifications.coreHardness.min || '',
                max: specifications.coreHardness.max || '',
                unit: specifications.coreHardness.unit || ''
              });
            }
            if (specifications.surfaceHardness && (specifications.surfaceHardness.min || specifications.surfaceHardness.max)) {
              legacySpecs.push({
                name: 'Surface',
                min: specifications.surfaceHardness.min || '',
                max: specifications.surfaceHardness.max || '',
                unit: specifications.surfaceHardness.unit || ''
              });
            }
            if (specifications.toothHardness && (specifications.toothHardness.min || specifications.toothHardness.max)) {
              legacySpecs.push({
                name: 'Tooth',
                min: specifications.toothHardness.min || '',
                max: specifications.toothHardness.max || '',
                unit: specifications.toothHardness.unit || ''
              });
            }
            hardnessSpecs = legacySpecs;
          }

          // Parser les spécifications ECD dynamiques
          let ecdSpecs = [];
          if (specifications.ecdSpecs && Array.isArray(specifications.ecdSpecs)) {
            ecdSpecs = specifications.ecdSpecs.map((spec) => ({
              name: spec.name || '',
              depthMin: spec.depthMin || '',
              depthMax: spec.depthMax || '',
              depthUnit: spec.depthUnit || '',
              hardness: spec.hardness || '',
              hardnessUnit: spec.hardnessUnit || ''
            }));
          } else {
            // Migration de l'ancienne spécification ECD vers le nouveau format
            if (specifications.ecd && (specifications.ecd.depthMin || specifications.ecd.depthMax || specifications.ecd.hardness)) {
              ecdSpecs = [{
                name: 'ECD',
                depthMin: specifications.ecd.depthMin || '',
                depthMax: specifications.ecd.depthMax || '',
                depthUnit: specifications.ecd.depthUnit || '',
                hardness: specifications.ecd.hardness || '',
                hardnessUnit: specifications.ecd.unit || ''
              }];
            }
          }

          // Extraire les valeurs en gérant les cas où les propriétés pourraient être undefined
          const formValues = {
            name: partData.name || data.name || '',
            designation: data.designation || '',
            clientDesignation: data.client_designation || '',
            reference: data.reference || '',
            quantity: data.quantity || '',
            description: partData.description || data.description || '',
            steel: data.steel || '',
            
            // Dimensions avec gestion de valeurs potentiellement undefined
            length: dimensions?.rectangular?.length || '',
            width: dimensions?.rectangular?.width || '',
            height: dimensions?.rectangular?.height || '',
            dimensionsUnit: dimensions?.rectangular?.unit || '',
            diameterIn: dimensions?.circular?.diameterIn || '',
            diameterOut: dimensions?.circular?.diameterOut || '',
            diameterUnit: dimensions?.circular?.unit || '',
            weight: dimensions?.weight?.value || '',
            weightUnit: dimensions?.weight?.unit || '',
            
            // Nouvelles spécifications dynamiques
            hardnessSpecs: hardnessSpecs,
            ecdSpecs: ecdSpecs,
          };
          
          console.log('Setting form data to:', formValues);
          
          // Mettre à jour l'état du formulaire
          setFormData(formValues);
            // Conserver parentId pour permettre l'édition
          if (data.parent_id || partData.parent_id) {
            setParentId(data.parent_id || partData.parent_id);
            console.log('Setting parent_id to:', data.parent_id || partData.parent_id);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des détails de la pièce:', error);
          console.error('Détails de l\'erreur:', error.response?.data || error.message);
          setMessage({
            type: 'danger',
            text: 'Impossible de charger les détails de la pièce'
          });
        } finally {
          setFetchingPart(false);
        }
      };
      
      fetchPartDetails();
    }
  }, [part, setFormData, setMessage, setFetchingPart, setParentId]);
};

export default usePartData;