/**
 * Middleware de vérification du mode lecture seule global
 * =====================================================
 * 
 * Ce middleware vérifie si le système entier est configuré en mode lecture seule.
 * Lorsque ce mode est activé, aucune opération de modification n'est autorisée,
 * quels que soient les droits de l'utilisateur, y compris pour les administrateurs.
 * 
 * Utilité:
 * - Maintenance du système: bloquer toute modification pendant des opérations de maintenance
 * - Protection des données: empêcher les modifications pendant des opérations critiques
 * - Périodes de gel: mise en place de périodes où aucune modification n'est permise
 * 
 * Configuration:
 * Le mode lecture seule global est activé via la configuration du système:
 * config.ACCESS.GLOBAL_READ_ONLY = true
 * 
 * Ce middleware est généralement utilisé en combinaison avec d'autres dans accessControl.js
 * pour former les middlewares writeAccess, adminWriteAccess et superUserWriteAccess.
 * 
 * @param {Object} req - Objet requête Express
 * @param {Object} res - Objet réponse Express
 * @param {Function} next - Fonction pour passer au middleware suivant
 * @returns {void}
 */

const config = require('../config/config');

const checkGlobalReadOnly = (req, res, next) => {
  // Vérifie si le mode lecture seule global est activé
  if (config.ACCESS && config.ACCESS.GLOBAL_READ_ONLY === true) {
    return res.status(403).json({
      success: false,
      message: 'Système en lecture seule. Aucune modification n\'est autorisée actuellement.'
    });
  }

  // Le mode lecture seule n'est pas activé, passe au middleware suivant
  next();
};

module.exports = checkGlobalReadOnly;
