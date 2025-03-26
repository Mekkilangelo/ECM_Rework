const useChemicalElementsHandlers = (formData, setFormData) => {
    // Ajouter un élément chimique
    const handleAddChemicalElement = () => {
      setFormData({
        ...formData,
        chemical_elements: [
          ...formData.chemical_elements,
          { 
            element: '',
            rate_type: 'exact',
            value: '',
            min_value: '',
            max_value: ''
          }
        ]
      });
    };
    
    // Supprimer un élément chimique
    const handleRemoveChemicalElement = (index) => {
      const updatedElements = [...formData.chemical_elements];
      updatedElements.splice(index, 1);
      
      setFormData({
        ...formData,
        chemical_elements: updatedElements
      });
    };
    
    // Modifier un élément chimique
    const handleChemicalElementChange = (index, field, value) => {
      const updatedElements = [...formData.chemical_elements];
      updatedElements[index] = {
        ...updatedElements[index],
        [field]: value
      };
      
      setFormData({
        ...formData,
        chemical_elements: updatedElements
      });
    };
    
    // Changer le type de taux (exact ou plage)
    const handleRateTypeChange = (index, rateType) => {
      const updatedElements = [...formData.chemical_elements];
      updatedElements[index] = {
        ...updatedElements[index],
        rate_type: rateType
      };
      
      setFormData({
        ...formData,
        chemical_elements: updatedElements
      });
    };
    
    return {
      handleAddChemicalElement,
      handleRemoveChemicalElement,
      handleChemicalElementChange,
      handleRateTypeChange
    };
  };
  
  export default useChemicalElementsHandlers;
  