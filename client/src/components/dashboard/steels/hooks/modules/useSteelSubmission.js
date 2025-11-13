import useApiSubmission from '../../../../../hooks/useApiSubmission';
import steelService from '../../../../../services/steelService';

/**
 * Hook spécifique pour gérer les soumissions d'aciers
 * @param {Object} options - Options de configuration
 * @param {Object} options.formData - Données du formulaire d'acier
 * @param {Function} options.setFormData - Fonction pour mettre à jour formData
 * @param {Function} options.validate - Fonction de validation
 * @param {Object} options.entity - Acier existant (pour le mode édition)
 * @param {Function} options.setLoading - Fonction pour définir l'état de chargement
 * @param {Function} options.setMessage - Fonction pour définir les messages
 * @param {Function} options.onCreated - Callback après création
 * @param {Function} options.onUpdated - Callback après mise à jour
 * @param {Function} options.onClose - Callback de fermeture
 * @param {boolean} options.viewMode - Mode lecture seule
 */
const useSteelSubmission = ({ 
  formData, 
  setFormData, 
  validate, 
  entity, 
  setLoading, 
  setMessage, 
  onCreated,
  onUpdated, 
  onClose,
  viewMode = false
}) => {
  const initialFormState = {
    grade: '',
    family: '',
    standard: '',
    equivalents: [],
    chemical_elements: []
  };
  
  const formatDataForApi = () => {
    // Préparer les données pour l'API
    const steelData = {
      name: formData.grade, // Utiliser le grade comme nom
      grade: formData.grade,
      family: formData.family,
      standard: formData.standard,
      equivalents: formData.equivalents,      // Transformer chemical_elements en chemistery
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
            min_value: element.min_value ? parseFloat(element.min_value) : null,
            max_value: element.max_value ? parseFloat(element.max_value) : null
          };
        }
      })
    };
    
    // Si vous voulez conserver chemical_elements pour la compatibilité frontend
    steelData.chemical_elements = steelData.chemistery;
    
    return steelData;
  };
    return useApiSubmission({
    formData,
    setFormData,
    validate,
    entity,
    setLoading,
    setMessage,
    onCreated,
    onUpdated: (data) => {
      // Appeler le callback original
      if (onUpdated) {
        onUpdated(data);
      }
      
      // Log pour déboguer
      
      
      // Ajouter un petit délai pour s'assurer que toutes les mises à jour en base sont terminées
      setTimeout(() => {
        // Forcer un re-rendu en modifiant formData avec les nouvelles données
        if (data && data.id) {
          setFormData(prev => ({ ...prev, lastUpdated: Date.now() }));
        }
      }, 300);
    },
    onClose,
    formatDataForApi,
    customApiService: {
      create: steelService.createSteel,
      update: steelService.updateSteel
    },
    entityType: 'Acier',
    initialFormState,
    viewMode
  });
};

export default useSteelSubmission;