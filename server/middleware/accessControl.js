/**
 * Module regroupant tous les middlewares de contrôle d'accès
 * Cela facilite l'application cohérente de toutes les règles de contrôle d'accès
 */

const { protect, editRightsOnly } = require('./auth');
const globalReadOnlyChecker = require('./globalReadOnlyChecker');

/**
 * Middleware combiné qui vérifie:
 * 1. Si l'utilisateur est authentifié (protect)
 * 2. Si le système n'est pas en mode lecture seule global (globalReadOnlyChecker)
 * 3. Si l'utilisateur a les droits d'édition (editRightsOnly)
 * 
 * Cette fonction retourne un tableau de middlewares qui seront exécutés en séquence
 * pour toutes les routes d'écriture (POST, PUT, DELETE)
 */
const writeAccess = [
  protect,
  globalReadOnlyChecker,
  editRightsOnly
];

/**
 * Middleware simplifié pour les routes qui nécessitent seulement une authentification
 * mais pas de droits d'édition spécifiques (routes de lecture)
 */
const readAccess = [
  protect
];

module.exports = {
  writeAccess,
  readAccess
};
