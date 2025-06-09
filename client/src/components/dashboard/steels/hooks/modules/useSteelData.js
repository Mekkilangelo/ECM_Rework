import { useEffect } from 'react';
import steelService from '../../../../../services/steelService';

/**
 * Hook pour récupérer et formater les données d'un acier
 * @param {Object} steel - L'acier à récupérer et formater
 * @param {Function} setFormData - Fonction pour mettre à jour les données du formulaire
 * @param {Function} setMessage - Fonction pour définir les messages d'erreur/succès
 * @param {Function} setFetchingSteel - Fonction pour indiquer l'état de chargement
 */
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
            
            // Utilisation de la méthode renommée getSteel au lieu de getSteelById
            const steelData = await steelService.getSteel(steelId);
            
            console.log('API Response:', steelData);
            
            // Récupérer les données du Node et du Steel (adaptation au nouveau format)
            const nodeData = steelData;
            const steelProperties = steelData.Steel || {};
            
            // Préparer les données pour le formulaire
            const formattedData = {
              id: nodeData.id,
              grade: steelProperties.grade || '',
              family: steelProperties.family || '',
              standard: steelProperties.standard || '',
              equivalents: Array.isArray(steelProperties.equivalents) ? steelProperties.equivalents : [],
              chemical_elements: []
            };
              // Transformer les données de chimie en éléments chimiques pour le formulaire
            if (Array.isArray(steelProperties.chemistery)) {
              formattedData.chemical_elements = steelProperties.chemistery.map(chem => ({
                element: chem.element || '',
                rate_type: (chem.min_value !== null && chem.min_value !== undefined) || 
                          (chem.max_value !== null && chem.max_value !== undefined) ? 'range' : 'exact',
                value: chem.value !== null && chem.value !== undefined ? chem.value.toString() : '',
                min_value: chem.min_value !== null && chem.min_value !== undefined ? chem.min_value.toString() : '',
                max_value: chem.max_value !== null && chem.max_value !== undefined ? chem.max_value.toString() : '',
              }));
            } else if (Array.isArray(steelProperties.elements)) {
              // Alternative si les éléments sont dans un autre champ
              formattedData.chemical_elements = steelProperties.elements.map(elem => ({
                element: elem.element || '',
                rate_type: (elem.min_value !== null && elem.min_value !== undefined) || 
                          (elem.max_value !== null && elem.max_value !== undefined) ? 'range' : 'exact',
                value: elem.value !== null && elem.value !== undefined ? elem.value.toString() : '',
                min_value: elem.min_value !== null && elem.min_value !== undefined ? elem.min_value.toString() : '',
                max_value: elem.max_value !== null && elem.max_value !== undefined ? elem.max_value.toString() : '',
              }));
            }
            
            // S'assurer que les équivalents et chemical_elements sont toujours des tableaux
            if (!Array.isArray(formattedData.equivalents)) {
              formattedData.equivalents = [];
            }
            
            if (!Array.isArray(formattedData.chemical_elements)) {
              formattedData.chemical_elements = [];
            }
            
            console.log('Formatted data for form:', formattedData);
            setFormData(formattedData);
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
