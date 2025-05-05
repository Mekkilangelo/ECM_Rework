const useChemicalElementsHandlers = (formData, setFormData) => {
    // Ajouter un élément chimique
    const handleAddChemicalElement = () => {
      // S'assurer que chemical_elements est un tableau
      const currentElements = Array.isArray(formData.chemical_elements) ? formData.chemical_elements : [];
      
      setFormData({
        ...formData,
        chemical_elements: [
          ...currentElements,
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
      // S'assurer que chemical_elements est un tableau
      const currentElements = Array.isArray(formData.chemical_elements) ? formData.chemical_elements : [];
      if (currentElements.length <= index) {
        return; // Ne rien faire si l'index est hors limites
      }
      
      const updatedElements = [...currentElements];
      updatedElements.splice(index, 1);
      
      setFormData({
        ...formData,
        chemical_elements: updatedElements
      });
    };
    
    // Modifier un élément chimique
    const handleChemicalElementChange = (index, field, value) => {
      // S'assurer que chemical_elements est un tableau
      const currentElements = Array.isArray(formData.chemical_elements) ? formData.chemical_elements : [];
      if (currentElements.length <= index) {
        return; // Ne rien faire si l'index est hors limites
      }
      
      const updatedElements = [...currentElements];
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
      // S'assurer que chemical_elements est un tableau
      const currentElements = Array.isArray(formData.chemical_elements) ? formData.chemical_elements : [];
      if (currentElements.length <= index) {
        return; // Ne rien faire si l'index est hors limites
      }
      
      const updatedElements = [...currentElements];
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
