import { toast } from 'react-toastify';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

/**
 * Hook générique pour gérer les soumissions d'API
 * @param {Object} options - Options de configuration
 * @param {Object} options.formData - Données du formulaire
 * @param {Function} options.setFormData - Fonction pour mettre à jour formData
 * @param {Function} options.validate - Fonction de validation
 * @param {Object} options.entity - Entité existante (pour le mode édition)
 * @param {string} options.entityId - ID de l'entité (si différent de entity.id)
 * @param {Function} options.setLoading - Fonction pour définir l'état de chargement
 * @param {Function} options.setMessage - Fonction pour définir les messages
 * @param {Function} options.setErrors - Fonction pour définir les erreurs de champs
 * @param {Function} options.onCreated - Callback après création
 * @param {Function} options.onUpdated - Callback après mise à jour
 * @param {Function} options.onClose - Callback de fermeture
 * @param {Function} options.formatDataForApi - Fonction pour formater les données
 * @param {string} options.endpoint - Point de terminaison API
 * @param {string} options.entityType - Type d'entité (pour les messages)
 * @param {Object} options.initialFormState - État initial du formulaire (pour réinitialisation)
 * @param {Function} options.fileAssociationCallback - Callback pour associer des fichiers
 */
const useApiSubmission = ({
  formData,
  setFormData,
  validate,
  entity,
  entityId,
  setLoading,
  setMessage,
  setErrors,
  onCreated,
  onUpdated,
  onClose,
  formatDataForApi,
  endpoint,
  entityType = 'élément',
  initialFormState = {},
  fileAssociationCallback,
  parentId,
  customApiService
}) => {
  const { t } = useTranslation();
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (typeof validate !== 'function') {
      console.error('La fonction de validation est manquante ou invalide');
      return;
    }

    if (!validate()) return;

    setLoading(true);
    setMessage(null);

    try {
      // Prépare les données pour l'API
      const apiData = formatDataForApi ? formatDataForApi() : formData;
      
      // Ajoute parentId aux données si fourni et pas déjà inclus
      if (parentId && !apiData.parent_id) {
        apiData.parent_id = parentId;
      }
      
      let response;
      const id = entityId || (entity && entity.id);
      
      if (id) {
        // Mode édition
        if (customApiService && customApiService.update) {
          response = await customApiService.update(id, apiData);
        } else {
          response = await api.put(`/${endpoint}/${id}`, apiData);
        }

        // Associer les fichiers à l'entité existante si nécessaire
        if (fileAssociationCallback) {
          await fileAssociationCallback(id);
        }
        
        setMessage({
          type: 'success',
          text: t('api.success.updated', { entityType })
        });
        
        if (onUpdated) {
          onUpdated(response.data);
        }
        
        // Si un toast est disponible, l'afficher
        if (toast && toast.success) {
          toast.success(response.message || t('api.success.updated', { entityType }));
        }
      } else {
        // Mode création
        console.log("Creating new entity with data:", apiData);
        
        if (customApiService && customApiService.create) {
          response = await customApiService.create(apiData);
        } else {
          response = await fetch(`${API_URL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiData)
          });
          response = await response.json();
        }
        
        console.log("Entity created successfully:", response.data || response);
        
        // Extraire l'ID du nœud créé
        const newNodeId = response.data?.id || response.id;
        console.log("New node ID:", newNodeId);
        
        // Associer les fichiers au nouvel ID de nœud
        if (fileAssociationCallback && newNodeId) {
          console.log("Calling file association callback with nodeId:", newNodeId);
          await fileAssociationCallback(newNodeId);
        } else {
          console.warn("File association skipped:", 
            !fileAssociationCallback ? "No callback" : "No nodeId");
        }
        
        setMessage({
          type: 'success',
          text: t('api.success.created', { entityType })
        });
        
        // Réinitialiser le formulaire
        if (setFormData && initialFormState) {
          setFormData(initialFormState);
        }
        
        if (onCreated) {
          onCreated(response.data || response);
        }
        
        // Si un toast est disponible, l'afficher
        if (toast && toast.success) {
          toast.success(response.message || t('api.success.created', { entityType }));
        }
      }
      
      // Fermer le formulaire après un délai
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 100);
      }
    } catch (error) {
      console.error(`Erreur lors de l'opération sur ${entityType}:`, error);
      
      // Gérer les erreurs de validation avec détails
      let errorMessage = error.response?.data?.message || 
        t('api.error.' + (entity ? 'update' : 'create'), { entityType });
      
      // Si l'erreur contient des détails de validation, les afficher
      if (error.response?.data?.errors && typeof error.response.data.errors === 'object') {
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.entries(validationErrors)
          .map(([field, message]) => `${field}: ${message}`)
          .join(', ');
        errorMessage = `${errorMessage} - ${errorMessages}`;
        
        // Mettre à jour les erreurs de champs spécifiques si setErrors est disponible
        if (setErrors) {
          const fieldErrors = {};
          Object.entries(validationErrors).forEach(([field, message]) => {
            // Convertir les messages en clés de traduction si possible
            if (field === 'name') {
              fieldErrors.name = 'validation.required.clientName';
            } else if (field === 'country') {
              fieldErrors.country = 'validation.required.country';
            } else {
              fieldErrors[field] = message;
            }
          });
          setErrors(fieldErrors);
        }
      }
      
      setMessage({
        type: 'danger',
        text: errorMessage
      });
      
      // Afficher l'erreur dans un toast
      if (toast && toast.error) {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return { handleSubmit };
};

export default useApiSubmission;