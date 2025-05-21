import { useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const usePartData = (part, setFormData, setMessage, setFetchingPart, setParentId) => {  useEffect(() => {
    if (part && part.id) {
      const fetchPartDetails = async () => {
        setFetchingPart(true);
        try {
          const response = await axios.get(`${API_URL}/parts/${part.id}`);
          const partData = response.data.data || response.data; // Tenir compte du format de réponse API standard
          
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
          }
          
          console.log('Dimensions parsed:', dimensions);
          console.log('Specifications parsed:', specifications);
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
            
            // Specifications avec gestion de valeurs potentiellement undefined
            coreHardnessMin: specifications?.coreHardness?.min || '',
            coreHardnessMax: specifications?.coreHardness?.max || '',
            coreHardnessUnit: specifications?.coreHardness?.unit || '',
            surfaceHardnessMin: specifications?.surfaceHardness?.min || '',
            surfaceHardnessMax: specifications?.surfaceHardness?.max || '',
            surfaceHardnessUnit: specifications?.surfaceHardness?.unit || '',
            toothHardnessMin: specifications?.toothHardness?.min || '',
            toothHardnessMax: specifications?.toothHardness?.max || '',
            toothHardnessUnit: specifications?.toothHardness?.unit || '',
            ecdDepthMin: specifications?.ecd?.depthMin || '',
            ecdDepthMax: specifications?.ecd?.depthMax || '',
            ecdHardness: specifications?.ecd?.hardness || '',
            ecdHardnessUnit: specifications?.ecd?.unit || '',
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