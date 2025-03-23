const useSelectHelpers = (unitOptions) => {
    // Fonctions utilitaires pour les options de select
    const getLengthUnitOptions = () => {
      return unitOptions.filter(unit => unit.type === 'length');
    };
    
    const getWeightUnitOptions = () => {
      return unitOptions.filter(unit => unit.type === 'weight');
    };
    
    const getHardnessUnitOptions = () => {
      return unitOptions.filter(unit => unit.type === 'hardness');
    };
    
    const getSelectedOption = (options, value) => {
      return options.find(option => option.value === value) || null;
    };
    
    // Style pour les composants Select
    const selectStyles = {
      control: (provided) => ({
        ...provided,
        borderColor: '#ced4da',
        boxShadow: 'none',
        '&:hover': {
          borderColor: '#80bdff'
        }
      }),
      menu: (provided) => ({
        ...provided,
        zIndex: 9999
      })
    };
    
    return {
      getLengthUnitOptions,
      getWeightUnitOptions,
      getHardnessUnitOptions,
      getSelectedOption,
      selectStyles
    };
  };
  
  export default useSelectHelpers;
  