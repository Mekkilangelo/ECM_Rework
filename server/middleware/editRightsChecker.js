// Ce middleware vérifie si l'utilisateur a les droits d'édition
// Empêche les utilisateurs ayant un rôle 'user' de faire des modifications
// Compatible avec le mode lecture seule (viewOnly) implémenté côté frontend

/**
 * Middleware pour vérifier si l'utilisateur a des droits d'édition
 * Les utilisateurs avec le rôle 'user' n'ont pas de droits d'édition (mode lecture seule)
 * Seuls les rôles 'admin' et 'superuser' peuvent effectuer des modifications
 */
const editRightsChecker = (req, res, next) => {
  // Vérifier si l'utilisateur existe et son rôle
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  // Vérifier si l'utilisateur a les droits d'édition (admin ou superuser)
  if (req.user.role !== 'admin' && req.user.role !== 'superuser') {
    return res.status(403).json({
      success: false,
      message: 'Droits d\'édition insuffisants. Mode lecture seule actif.'
    });
  }

  // L'utilisateur a les droits d'édition, continuer
  next();
};

module.exports = editRightsChecker;
