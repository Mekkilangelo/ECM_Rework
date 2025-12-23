import useApiSubmission from '../../../../../hooks/useApiSubmission';
import partService from '../../../../../services/partService';

/**
 * Hook spécifique pour gérer les soumissions de pièces
 */
const usePartSubmission = (
  formData, 
  parentId, 
  setFormData, 
  validate, 
  part,
  setLoading, 
  setMessage, 
  onPartCreated, 
  onPartUpdated, 
  onClose,
  fileAssociationCallback
) => {  const initialFormState = {
    name: '',
    designation: '',
    clientDesignation: '',
    reference: '',
    quantity: '',
    length: '',
    width: '',
    height: '',
    dimensionsUnit: '',
    diameterIn: '',
    diameterOut: '',
    diameterUnit: '',
    weight: '',
    weightUnit: '',
    hardnessSpecs: [],
    ecdSpecs: [],
    steel: '',
    steelId: null,
    description: ''
  };
    const formatDataForApi = () => {
    // Le backend attend les champs en snake_case, pas un objet JSON
    return {
      parent_id: parentId,
      designation: formData.designation || null,
      client_designation: formData.clientDesignation || null,
      reference: formData.reference || null,
      quantity: formData.quantity || null,
      steel_node_id: formData.steelId || null,
      description: formData.description || null,
      
      // Dimensions - Poids
      dim_weight_value: formData.weight || null,
      dim_weight_unit: formData.weightUnit || null,
      
      // Dimensions - Rectangulaires
      dim_rect_length: formData.length || null,
      dim_rect_width: formData.width || null,
      dim_rect_height: formData.height || null,
      dim_rect_unit: formData.dimensionsUnit || null,
      
      // Dimensions - Circulaires
      dim_circ_diameterIn: formData.diameterIn || null,
      dim_circ_diameterOut: formData.diameterOut || null,
      dim_circ_unit: formData.diameterUnit || null,
      
      // Spécifications (seront gérées séparément via specs_hardness et specs_ecd)
      hardnessSpecs: formData.hardnessSpecs || [],
      ecdSpecs: formData.ecdSpecs || []
    };
  };
  // Wrap le callback d'association de fichiers pour le faire fonctionner avec useApiSubmission
  const wrappedFileAssociationCallback = fileAssociationCallback ? 
    async (nodeId) => {
      if (typeof fileAssociationCallback === 'function') {
        return await fileAssociationCallback(nodeId);
      }
      return true;
    } : null;
  
  return useApiSubmission({
    formData,
    setFormData,
    validate,
    entity: part,
    setLoading,
    setMessage,
    onCreated: onPartCreated,
    onUpdated: onPartUpdated,
    onClose,
    formatDataForApi,
    customApiService: {
      create: partService.createPart,
      update: partService.updatePart
    },
    entityType: 'Pièce',
    initialFormState,
    fileAssociationCallback: wrappedFileAssociationCallback,
    parentId
  });
};

export default usePartSubmission;