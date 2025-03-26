import { useState } from 'react';

const useFormState = () => {
  const [formData, setFormData] = useState({
    grade: '',
    family: '',
    standard: '',
    equivalents: [],
    chemical_elements: []
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [fetchingSteel, setFetchingSteel] = useState(false);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    loading,
    setLoading,
    message,
    setMessage,
    fetchingSteel,
    setFetchingSteel
  };
};

export default useFormState;
