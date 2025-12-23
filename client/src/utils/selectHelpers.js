/**
 * Utilitaires pour les composants react-select
 */

/**
 * Extrait la valeur d'une option react-select
 * Gère les différents formats d'options
 *
 * @param {Object|string} option - L'option à traiter
 * @returns {string} - La valeur extraite
 */
const getOptionValue = (option) => {
  if (typeof option === 'object') {
    return option.value || option.label || option.name;
  }
  return option;
};

/**
 * Vérifie si une nouvelle option peut être créée dans un CreatableSelect
 * Cette fonction permet de créer une option même si elle correspond partiellement à une option existante
 *
 * Par exemple:
 * - Si "HV2" existe dans la liste, on peut quand même créer "HV"
 * - Si "mm" existe, on peut créer "m"
 *
 * @param {string} inputValue - La valeur saisie par l'utilisateur
 * @param {string} selectValue - La valeur actuellement sélectionnée
 * @param {Array} selectOptions - Les options disponibles dans le select
 * @returns {boolean} - true si la nouvelle option peut être créée
 */
export const isValidNewOption = (inputValue, selectValue, selectOptions) => {
  // Si l'input est vide ou ne contient que des espaces, ne pas permettre la création
  if (!inputValue || !inputValue.trim()) {
    return false;
  }

  // Vérifier si une option avec EXACTEMENT la même valeur existe déjà
  const exactMatch = selectOptions.some(option => {
    const optionValue = getOptionValue(option);
    return optionValue?.toString().toLowerCase() === inputValue.toString().toLowerCase();
  });

  // Permettre la création seulement si aucune correspondance exacte n'existe
  return !exactMatch;
};

/**
 * Fonction de filtrage personnalisée pour react-select
 * Filtre les options et les trie par pertinence :
 * 1. Correspondance exacte en premier
 * 2. Options qui commencent par la recherche
 * 3. Options qui contiennent la recherche
 *
 * @param {Object} option - L'option à filtrer
 * @param {string} inputValue - La valeur de recherche saisie
 * @returns {boolean} - true si l'option doit être affichée
 */
export const customFilterOption = (option, inputValue) => {
  if (!inputValue) return true;

  const optionValue = getOptionValue(option.data);
  const optionLabel = option.label || '';
  const search = inputValue.toLowerCase();

  // Chercher dans la valeur et le label
  const valueStr = optionValue?.toString().toLowerCase() || '';
  const labelStr = optionLabel.toString().toLowerCase();

  return valueStr.includes(search) || labelStr.includes(search);
};

/**
 * Fonction de tri pour afficher les options les plus pertinentes en premier
 * Utilisée avec filterOption pour créer une expérience de recherche optimale
 *
 * @param {Array} options - Les options filtrées
 * @param {string} inputValue - La valeur de recherche
 * @returns {Array} - Les options triées par pertinence
 */
export const sortOptionsByRelevance = (options, inputValue) => {
  if (!inputValue || !options || options.length === 0) {
    return options;
  }

  const search = inputValue.toLowerCase();

  return [...options].sort((a, b) => {
    const aValue = getOptionValue(a)?.toString().toLowerCase() || '';
    const bValue = getOptionValue(b)?.toString().toLowerCase() || '';

    // Correspondance exacte = priorité maximale
    const aExact = aValue === search;
    const bExact = bValue === search;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // Commence par la recherche = priorité haute
    const aStarts = aValue.startsWith(search);
    const bStarts = bValue.startsWith(search);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    // Contient la recherche = priorité normale (déjà filtré)
    // Trier par longueur (plus court = plus pertinent)
    if (aValue.length !== bValue.length) {
      return aValue.length - bValue.length;
    }

    // Ordre alphabétique en dernier recours
    return aValue.localeCompare(bValue);
  });
};

/**
 * Version par défaut pour compatibility avec les anciens composants
 */
export default isValidNewOption;
