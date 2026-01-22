import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook simple pour gérer la fonctionnalité Copy/Paste des formulaires
 * @param {object} params - Paramètres du hook
 * @param {string} params.formType - Type de formulaire (order, part, test, client, steel)
 * @param {function} params.getFormData - Fonction pour obtenir les données actuelles du formulaire
 * @param {function} params.setFormData - Fonction pour mettre à jour les données du formulaire
 * @param {function} params.formatForApi - Fonction pour formater les données comme pour l'API
 * @param {function} params.parseFromApi - Fonction pour parser les données comme depuis l'API
 */
const useCopyPaste = ({ formType, getFormData, setFormData, formatForApi, parseFromApi }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState(null);

  // Utiliser des refs pour toujours avoir les fonctions les plus récentes
  const getFormDataRef = useRef(getFormData);
  const formatForApiRef = useRef(formatForApi);
  const parseFromApiRef = useRef(parseFromApi);

  // Mettre à jour les refs quand les fonctions changent
  useEffect(() => {
    getFormDataRef.current = getFormData;
    formatForApiRef.current = formatForApi;
    parseFromApiRef.current = parseFromApi;
  }, [getFormData, formatForApi, parseFromApi]);

  // Clé pour le localStorage
  const STORAGE_KEY = `ecm_copy_paste_${formType}`;

  /**
   * Copier les données du formulaire en cache
   */
  const handleCopy = useCallback(() => {
    try {
      // Obtenir les données actuelles du formulaire via la ref
      const currentFormData = getFormDataRef.current();
      
      // Utiliser la même logique de formatage que pour l'API
      const formattedData = formatForApiRef.current ? formatForApiRef.current(currentFormData) : currentFormData;
      
      // Vérifier que les données ne sont pas undefined
      if (formattedData === undefined || formattedData === null) {
        throw new Error('Les données formatées sont undefined ou null');
      }
      
      // Stocker en localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formattedData));
      
      // Message de succès
      setMessage({
        type: 'success',
        text: t('copyPaste.copySuccess')
      });
      
      // Effacer le message après 3 secondes
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      setMessage({
        type: 'error',
        text: t('copyPaste.copyError')
      });
      setTimeout(() => setMessage(null), 3000);
    }
  }, [formType, t, STORAGE_KEY]);

  /**
   * Coller les données depuis le cache
   */
  const handlePaste = useCallback(() => {
    try {
      // Vérifier s'il y a des données en cache pour ce type
      const cachedData = localStorage.getItem(STORAGE_KEY);
      
      if (!cachedData || cachedData === 'undefined') {
        setMessage({
          type: 'warning',
          text: t('copyPaste.noCachedData')
        });
        setTimeout(() => setMessage(null), 3000);
        return;
      }

      // Parser les données
      const parsedData = JSON.parse(cachedData);
      
      // Utiliser la même logique de parsing que depuis l'API via la ref
      const processedData = parseFromApiRef.current ? parseFromApiRef.current(parsedData) : parsedData;
      
      // Mettre à jour le formulaire
      setFormData(processedData);
      
      // Message de succès
      setMessage({
        type: 'success',
        text: t('copyPaste.pasteSuccess')
      });
      
      // Effacer le message après 3 secondes
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      console.error('Erreur lors du collage:', error);
      setMessage({
        type: 'error',
        text: t('copyPaste.pasteError')
      });
      setTimeout(() => setMessage(null), 3000);
    }
  }, [setFormData, formType, t, STORAGE_KEY]);

  return {
    handleCopy,
    handlePaste,
    message
  };
};

export default useCopyPaste;
