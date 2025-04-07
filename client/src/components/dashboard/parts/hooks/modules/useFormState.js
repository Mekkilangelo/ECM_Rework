import { useState } from 'react';

const useFormState = () => {
  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    clientDesignation: '',
    reference: '',
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
    steel: ''
  });
  
  // États pour les options des select
  const [designationOptions, setDesignationOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [steelOptions, setSteelOptions] = useState([]);
  
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
    designationOptions,
    setDesignationOptions,
    unitOptions,
    setUnitOptions,
    steelOptions,
    setSteelOptions,
    parentId,
    setParentId
  };
};

export default useFormState;
