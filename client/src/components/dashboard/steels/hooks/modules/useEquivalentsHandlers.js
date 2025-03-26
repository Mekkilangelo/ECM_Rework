// modules/useEquivalentsHandlers.js
const useEquivalentsHandlers = (formData, setFormData) => {
  // Ajouter un équivalent vide à la liste
  const handleAddEquivalent = () => {
    setFormData({
      ...formData,
      equivalents: [
        ...formData.equivalents, 
        { steel_id: '' }  // Structure d'un équivalent vide
      ]
    });
  };

  // Retirer un équivalent par son index
  const handleRemoveEquivalent = (index) => {
    const updatedEquivalents = [...formData.equivalents];
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
