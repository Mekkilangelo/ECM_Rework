import { useEffect } from 'react';
import enumService from '../../../../../services/enumService';
import steelService from '../../../../../services/steelService';

const useOptionsData = (setLoading, setDesignationOptions, setUnitOptions, setSteelOptions) => {
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        
        // Récupérer les désignations de pièces
        try {
          const designationsResponse = await enumService.getDesignations();
          if (designationsResponse.data && designationsResponse.data.values) {
            const designations = designationsResponse.data.values || [];
            setDesignationOptions(designations.map(designation => ({ 
              value: designation, 
              label: designation 
            })));
          } else {
            console.warn('Format de réponse des désignations inattendu:', designationsResponse);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des désignations:', error);
        }
        
        // Récupérer les unités
        try {
          const units = await enumService.getUnits();
          setUnitOptions(units.map(unit => ({ 
            value: unit.id, 
            label: unit.name,
            type: unit.type 
          })));
        } catch (error) {
          console.error('Erreur lors de la récupération des unités:', error);
        }
        
        // Récupérer les grades d'acier
        try {
          const steels = await steelService.getSteelGrades();
          
          // Transformer pour le Select
          setSteelOptions(steels.map(grade => ({ 
            value: grade,
            label: grade
          })));
        } catch (error) {
          console.error('Erreur lors de la récupération des grades d\'acier:', error);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des options:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOptions();
  }, [setLoading, setDesignationOptions, setUnitOptions, setSteelOptions]);
};

export default useOptionsData;
