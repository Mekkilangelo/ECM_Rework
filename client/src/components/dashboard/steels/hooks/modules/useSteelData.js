import { useEffect } from 'react';
import steelService from '../../../../../services/steelService';

const useSteelData = (steel, setFormData, setMessage, setFetchingSteel) => {
  useEffect(() => {
    if (steel) {
      // Récupérer l'ID du steel, qui peut être à différents endroits selon la structure
      const steelId = steel.id || (steel.Steel && steel.id);
      
      if (steelId) {
        const fetchSteelData = async () => {
          try {
            setFetchingSteel(true);
            console.log(`Fetching steel with ID: ${steelId}`);
            const response = await steelService.getSteelById(steelId);
            
            if (response && response.data) {
              console.log('API Response:', response.data);
              
              // Récupérer les données du Node et du Steel
              const nodeData = response.data;
              const steelData = response.data.Steel || {};
              
              // Préparer les données pour le formulaire
              const formattedData = {
                id: nodeData.id,
                grade: steelData.grade || '',
                family: steelData.family || '',
                standard: steelData.standard || '',
                equivalents: Array.isArray(steelData.equivalents) ? steelData.equivalents : [],
                chemical_elements: []
              };
              
              // Transformer les données de chimie en éléments chimiques pour le formulaire
              if (Array.isArray(steelData.chemistery)) {
                formattedData.chemical_elements = steelData.chemistery.map(chem => ({
                  element: chem.element,
                  rate_type: (chem.min_value !== null && chem.min_value !== undefined && 
                              chem.max_value !== null && chem.max_value !== undefined) ? 'range' : 'exact',
                  value: chem.value !== null ? chem.value.toString() : '',
                  min_value: chem.min_value !== null ? chem.min_value.toString() : '',
                  max_value: chem.max_value !== null ? chem.max_value.toString() : '',
                }));
              } else if (Array.isArray(steelData.elements)) {
                // Alternative si les éléments sont dans un autre champ
                formattedData.chemical_elements = steelData.elements.map(elem => ({
                  element: elem.element,
                  rate_type: (elem.min_value !== null && elem.max_value !== null) ? 'range' : 'exact',
                  value: elem.value !== null ? elem.value.toString() : '',
                  min_value: elem.min_value !== null ? elem.min_value.toString() : '',
                  max_value: elem.max_value !== null ? elem.max_value.toString() : '',
                }));
              }
              
              console.log('Formatted data for form:', formattedData);
              setFormData(formattedData);
            }
          } catch (error) {
            console.error('Error fetching steel data:', error);
            setMessage({
              type: 'danger',
              text: 'Erreur lors du chargement des données de l\'acier: ' + 
                    (error.response?.data?.message || error.message || 'Erreur inconnue')
            });
          } finally {
            setFetchingSteel(false);
          }
        };
        
        fetchSteelData();
      } else {
        console.warn('No steel ID found for editing');
      }
    }
  }, [steel, setFormData, setMessage, setFetchingSteel]);
};

export default useSteelData;
