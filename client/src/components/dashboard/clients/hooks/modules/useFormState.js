import { useState } from 'react';

const useFormState = () => {
  const [formData, setFormData] = useState({
    name: '',
    client_code: '',
    country: '',
    city: '',
    client_group: '',
    address: '',
    description: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchingClient, setFetchingClient] = useState(false);
  const [message, setMessage] = useState(null);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    loading,
    setLoading,
    fetchingClient,
    setFetchingClient,
    message,
    setMessage
  };
};

export default useFormState;