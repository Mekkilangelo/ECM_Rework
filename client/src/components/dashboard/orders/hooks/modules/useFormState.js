import { useState } from 'react';

const useFormState = () => {
  const [formData, setFormData] = useState({
    request_date: new Date().toISOString().split('T')[0],
    description: '',
    commercial: '',
    contacts: [{ name: '', phone: '', email: '' }]
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [fetchingOrder, setFetchingOrder] = useState(false);
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
    fetchingOrder,
    setFetchingOrder,
    parentId,
    setParentId
  };
};

export default useFormState;
