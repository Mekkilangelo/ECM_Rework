import { useState } from 'react';

const useFormState = () => {
  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    clientDesignation: '',
    reference: '',
    quantity: '',
    description: '',
    // Dimensions
    length: '',
    width: '',
    height: '',
    dimensionsUnit: '',
    diameterIn: '',
    diameterOut: '',
    diameterUnit: '',
    weight: '',
    weightUnit: '',
    // Specifications
    coreHardnessMin: '',
    coreHardnessMax: '',
    coreHardnessUnit: '',
    surfaceHardnessMin: '',
    surfaceHardnessMax: '',
    surfaceHardnessUnit: '',
    toothHardnessMin: '',
    toothHardnessMax: '',
    toothHardnessUnit: '',
    ecdDepthMin: '',
    ecdDepthMax: '',
    ecdHardness: '',
    ecdHardnessUnit: '',
    steel: '',
    steelId: null
  });
  
  // États pour la gestion des erreurs, du chargement et des messages
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [fetchingPart, setFetchingPart] = useState(false);
  const [parentId, setParentId] = useState(null);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    loading,
    setLoading,
    message,
    setMessage,
    fetchingPart,
    setFetchingPart,
    parentId,
    setParentId
  };
};

export default useFormState;
