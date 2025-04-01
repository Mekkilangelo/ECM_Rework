import { useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const usePartData = (part, setFormData, setMessage, setFetchingPart, setParentId) => {
  useEffect(() => {
    if (part && part.id) {
      const fetchPartDetails = async () => {
        setFetchingPart(true);
        try {
          const response = await axios.get(`${API_URL}/parts/${part.id}`);
          const partData = response.data;
          
          // Vérifier si les données sont dans la propriété part ou directement dans partData
          const data = partData.Part || partData;
          
          // S'assurer que dimensions et specifications sont des objets et non des chaînes
          const dimensions = typeof data.dimensions === 'string' 
            ? JSON.parse(data.dimensions) 
            : (data.dimensions || {});
            
          const specifications = typeof data.specifications === 'string' 
            ? JSON.parse(data.specifications) 
            : (data.specifications || {});
          
          console.log('Dimensions parsed:', dimensions);
          console.log('Specifications parsed:', specifications);
          
          // Mettre à jour l'état du formulaire avec les données de la pièce
          setFormData({
            name: partData.name || '',
            designation: data.designation || '',
            // Dimensions
            length: dimensions.rectangular?.length || '',
            width: dimensions.rectangular?.width || '',
            height: dimensions.rectangular?.height || '',
            dimensionsUnit: dimensions.rectangular?.unit || '',
            diameterIn: dimensions.circular?.diameterIn || '',
            diameterOut: dimensions.circular?.diameterOut || '',
            diameterUnit: dimensions.circular?.unit || '',
            weight: dimensions.weight?.value || '',
            weightUnit: dimensions.weight?.unit || '',
            // Specifications
            coreHardnessMin: specifications.coreHardness?.min || '',
            coreHardnessMax: specifications.coreHardness?.max || '',
            coreHardnessUnit: specifications.coreHardness?.unit || '',
            surfaceHardnessMin: specifications.surfaceHardness?.min || '',
            surfaceHardnessMax: specifications.surfaceHardness?.max || '',
            surfaceHardnessUnit: specifications.surfaceHardness?.unit || '',
            toothHardnessMin: specifications.toothHardness?.min || '',
            toothHardnessMax: specifications.toothHardness?.max || '',
            toothHardnessUnit: specifications.toothHardness?.unit || '',
            ecdDepthMin: specifications.ecd?.depthMin || '',
            ecdDepthMax: specifications.ecd?.depthMax || '',
            ecdHardness: specifications.ecd?.hardness || '',
            ecdHardnessUnit: specifications.ecd?.unit || '',
            steel: data.steel || '',
            description: partData.description || ''
          });
          
          // Conserver parentId pour permettre l'édition
          if (data.parent_id) {
            setParentId(data.parent_id);
          }
          
          console.log('FormData set to:', {
            name: data.name || '',
            designation: data.designation || '',
            // autres champs...
          });
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