import { useState } from 'react';

/**
 * Hook générique pour gérer l'état des formulaires CRUD
 * Centralise la logique commune à tous les formulaires d'entités (clients, orders, parts, steels, tests)
 *
 * @param {Object} initialFormData - Données initiales du formulaire (structure spécifique à chaque entité)
 * @param {Object} options - Options de configuration
 * @param {string} options.entityName - Nom de l'entité (ex: 'Client', 'Order') pour générer les noms de state dynamiques
 * @param {boolean} options.withParentId - Indique si on doit gérer un parentId (pour les entités hiérarchiques)
 * @param {boolean} options.withFetching - Indique si on doit gérer un état de fetching (par défaut true)
 *
 * @returns {Object} États et setters du formulaire
 *
 * @example
 * // Utilisation pour un formulaire client
 * const {
 *   formData, setFormData,
 *   errors, setErrors,
 *   loading, setLoading,
 *   message, setMessage,
 *   fetchingClient, setFetchingClient
 * } = useGenericFormState(
 *   { name: '', country: '', city: '' },
 *   { entityName: 'Client' }
 * );
 *
 * @example
 * // Utilisation pour un formulaire avec parentId
 * const {
 *   formData, setFormData,
 *   errors, setErrors,
 *   parentId, setParentId
 * } = useGenericFormState(
 *   { request_date: '', description: '' },
 *   { entityName: 'Order', withParentId: true }
 * );
 */
const useGenericFormState = (initialFormData = {}, options = {}) => {
  const {
    entityName = 'Entity',
    withParentId = false,
    withFetching = true
  } = options;

  // États communs à tous les formulaires
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // État de fetching (optionnel, activé par défaut)
  const [fetching, setFetching] = useState(false);

  // État parentId (optionnel, pour les entités hiérarchiques comme orders, parts)
  const [parentId, setParentId] = useState(null);

  // Construction du retour avec nommage dynamique pour le fetching
  const returnValue = {
    formData,
    setFormData,
    errors,
    setErrors,
    loading,
    setLoading,
    message,
    setMessage
  };

  // Ajouter le fetching state avec nom dynamique si activé
  if (withFetching) {
    const fetchingStateName = `fetching${entityName}`;
    const setFetchingStateName = `setFetching${entityName}`;

    returnValue[fetchingStateName] = fetching;
    returnValue[setFetchingStateName] = setFetching;
  }

  // Ajouter parentId si nécessaire
  if (withParentId) {
    returnValue.parentId = parentId;
    returnValue.setParentId = setParentId;
  }

  return returnValue;
};

export default useGenericFormState;
