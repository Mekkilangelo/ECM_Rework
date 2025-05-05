// modules/useEquivalentsHandlers.js
const useEquivalentsHandlers = (formData, setFormData) => {
  // Ajouter un équivalent vide à la liste
  const handleAddEquivalent = () => {
    // S'assurer que equivalents est un tableau
    const currentEquivalents = Array.isArray(formData.equivalents) ? formData.equivalents : [];
    
    setFormData({
      ...formData,
      equivalents: [
        ...currentEquivalents, 
        { grade: '', standard: '' }  // Structure d'un équivalent vide
      ]
    });
  };

  // Retirer un équivalent par son index
  const handleRemoveEquivalent = (index) => {
    // S'assurer que equivalents est un tableau
    const currentEquivalents = Array.isArray(formData.equivalents) ? formData.equivalents : [];
    if (currentEquivalents.length <= index) {
      return; // Ne rien faire si l'index est hors limites
    }
    
    const updatedEquivalents = [...currentEquivalents];
    updatedEquivalents.splice(index, 1);
    setFormData({
      ...formData,
      equivalents: updatedEquivalents
    });
  };

  return {
    handleAddEquivalent,
    handleRemoveEquivalent
  };
};

export default useEquivalentsHandlers;
