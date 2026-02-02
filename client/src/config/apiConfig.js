/**
 * Configuration centralisée des URLs de l'API
 * Gère automatiquement les environnements dev/prod
 */

/**
 * Obtient l'URL de base de l'API (avec /api)
 * @returns {string} URL de base de l'API
 */
export const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Fallback sur window.location.origin si disponible
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/api`;
  }

  // Fallback final pour le développement
  return 'http://localhost:5001/api';
};

/**
 * Obtient l'URL de base du serveur (sans /api)
 * Utilisé pour les fichiers statiques (images, logos, etc.)
 * @returns {string} URL de base du serveur
 */
export const getBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    // Retirer le /api à la fin si présent
    return process.env.REACT_APP_API_URL.replace(/\/api$/, '');
  }

  // Fallback sur window.location.origin si disponible
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }

  // Fallback final pour le développement
  return 'http://localhost:5001';
};

/**
 * Construit une URL complète pour un fichier statique
 * @param {string} path - Chemin relatif (ex: '/images/logo.png')
 * @returns {string} URL complète
 */
export const getStaticFileUrl = (path) => {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
