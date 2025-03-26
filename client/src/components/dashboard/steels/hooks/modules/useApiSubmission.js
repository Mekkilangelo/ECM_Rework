import steelService from '../../../../../services/steelService';

const useApiSubmission = (
  formData, 
  setFormData, 
  validate, 
  steel,
  setLoading, 
  setMessage, 
  onSteelCreated,
  onSteelUpdated, 
  onClose
) => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Valider le formulaire
    if (!validate()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Préparer les données pour l'API
      const steelData = {
        name: formData.grade, // Utiliser le grade comme nom
        grade: formData.grade,
        family: formData.family,
        standard: formData.standard,
        equivalents: formData.equivalents, 
        // Transformer chemical_elements en chemistery si nécessaire
        chemistery: formData.chemical_elements.map(element => {
          // Transformer les éléments chimiques pour l'API
          if (element.rate_type === 'exact') {
            return {
              element: element.element,
              value: parseFloat(element.value),
              min_value: null,
              max_value: null
            };
          } else {
            return {
              element: element.element,
              value: null,
              min_value: parseFloat(element.min_value),
              max_value: parseFloat(element.max_value)
            };
          }
        })
      };
      
      // Si vous voulez conserver chemical_elements pour la compatibilité frontend
      steelData.chemical_elements = steelData.chemistery;
      
      let response;
      
      if (steel && steel.id) {
        // Mode édition
        response = await steelService.updateSteel(steel.id, steelData);
        
        if (response.status === 200) {
          setMessage({
            type: 'success',
            text: 'Acier mis à jour avec succès!'
          });
          
          if (typeof onSteelUpdated === 'function') {
            onSteelUpdated(response.data);
          }
        }
      } else {
        // Mode création
        response = await steelService.createSteel(steelData);
        
        if (response.status === 201) {
          setFormData({
            grade: '',
            family: '',
            standard: '',
            equivalents: [],
            chemical_elements: []
          });
          
          setMessage({
            type: 'success',
            text: 'Acier créé avec succès!'
          });
          
          if (typeof onSteelCreated === 'function') {
            onSteelCreated(response.data);
          }
        }
      }
      
      // Fermer le formulaire après un court délai
      setTimeout(() => {
        if (typeof onClose === 'function') {
          onClose();
        }
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      
      const errorMsg = error.response?.data?.message || 'Une erreur est survenue lors de la sauvegarde.';
      setMessage({
        type: 'danger',
        text: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };
  
  
  return { handleSubmit };
};

export default useApiSubmission;
