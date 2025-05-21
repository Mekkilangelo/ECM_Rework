/**
 * Classes d'erreurs personnalisées
 * Pour une meilleure gestion des différents types d'erreurs dans l'application
 */

/**
 * Erreur de base pour l'application
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreur pour les ressources non trouvées (404)
 */
class NotFoundError extends AppError {
  constructor(message = 'Ressource non trouvée') {
    super(message, 404);
  }
}

/**
 * Erreur pour les problèmes de validation des données (400)
 */
class ValidationError extends AppError {
  constructor(message = 'Données invalides', errors = null) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Erreur pour les problèmes d'authentification (401)
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentification requise') {
    super(message, 401);
  }
}

/**
 * Erreur pour les problèmes d'autorisation (403)
 */
class AuthorizationError extends AppError {
  constructor(message = 'Accès non autorisé') {
    super(message, 403);
  }
}

/**
 * Erreur pour les conflits dans les ressources (409)
 */
class ConflictError extends AppError {
  constructor(message = 'Conflit avec une ressource existante') {
    super(message, 409);
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ConflictError
};
