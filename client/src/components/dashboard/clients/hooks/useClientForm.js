import { useState, useEffect } from 'react';
import clientService from '../../../../services/clientService';
import enumService from '../../../../services/enumService';

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const useClientForm = (client, onClose, onClientCreated, onClientUpdated) => {
  const [formData, setFormData] = useState({
    name: '',
    client_code: '',
    country: '',
    city: '',
    client_group: '',
    address: '',
    description: ''
  });

  // États pour les options des select
  const [countryOptions, setCountryOptions] = useState([]);

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
  
  // Fonction utilitaire pour obtenir l'option sélectionnée
  const getSelectedOption = (options, value) => {
    if (!options || !Array.isArray(options)) {
      return null;
    }
    
    if (!value) {
      return null;
    }
    
    return options.find(option => option.value === value) || null;
  };
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingClient, setFetchingClient] = useState(false);
  const [message, setMessage] = useState(null);

  // Charger les données des options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);

        // Récupérer les options d'énumération pour les pays
        const countryResponse = await enumService.getEnumValues('clients', 'country');
        if (countryResponse.data && countryResponse.data.values) {
          const countries = countryResponse.data.values || [];
          setCountryOptions(countries.map(country => ({ 
            value: country, 
            label: country 
          })));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des options:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOptions();
  }, [setLoading]);

  
  // Charger les données complètes du client si on est en mode édition
  useEffect(() => {
    const fetchClientDetails = async () => {
      if (client && client.id) {
        try {
          setFetchingClient(true);
          const response = await clientService.getClient(client.id);
          const clientData = response.data;
          
          console.log("Client data received:", clientData);
          
          setFormData({
            name: clientData.name || '',
            client_code: clientData.Client?.client_code || '',
            country: clientData.Client?.country || '',
            city: clientData.Client?.city || '',
            client_group: clientData.Client?.client_group || '',
            address: clientData.Client?.address || ''
          });
        } catch (error) {
          console.error('Erreur lors du chargement des détails du client:', error);
          setMessage({
            type: 'danger',
            text: 'Impossible de charger les données du client.'
          });
        } finally {
          setFetchingClient(false);
        }
      }
    };
  
    fetchClientDetails();
  }, [client]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSelectChange = (selectedOption, { name }) => {
    setFormData(prev => ({ ...prev, [name]: selectedOption ? selectedOption.value : '' }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Le nom est requis';
    if (!formData.client_code?.trim()) newErrors.client_code = 'Le code client est requis';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      let response;
      
      if (client) {
        // Mode édition
        response = await clientService.updateClient(client.id, formData);
        setMessage({
          type: 'success',
          text: 'Client modifié avec succès!'
        });
        
        if (onClientUpdated) {
          onClientUpdated(response.data);
        }
      } else {
        // Mode création
        response = await clientService.createClient(formData);
        setMessage({
          type: 'success',
          text: 'Client créé avec succès!'
        });
        
        setFormData({
          name: '',
          client_code: '',
          country: '',
          city: '',
          client_group: '',
          address: ''
        });
        
        if (onClientCreated) {
          onClientCreated(response.data);
        }
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de l\'opération:', error);
      setMessage({
        type: 'danger',
        text: error.response?.data?.message || `Une erreur est survenue lors de ${client ? 'la modification' : 'la création'} du client`
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    errors,
    loading,
    fetchingClient,
    message,
    countryOptions,
    selectStyles,
    getSelectedOption,
    handleSelectChange,
    handleSubmit
  };
};

export default useClientForm;
