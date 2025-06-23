const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { logCrudAction, logCrudSuccess } = require('../middleware/logging');

/**
 * Routes pour la gestion des logs
 * ===============================
 * 
 * Toutes les routes sont protégées et réservées aux administrateurs
 */

// Middleware d'authentification et d'autorisation pour toutes les routes
router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/logs
 * Récupère la liste des logs avec pagination et filtres
 * Query params:
 * - page: numéro de page (défaut: 1)
 * - limit: nombre d'éléments par page (défaut: 50, max: 500)
 * - level: niveau de log (error, warning, info, success, debug)
 * - action: action effectuée
 * - entity: type d'entité
 * - userId: ID de l'utilisateur
 * - username: nom d'utilisateur
 * - dateFrom: date de début (ISO string)
 * - dateTo: date de fin (ISO string)
 * - ipAddress: adresse IP
 * - orderBy: champ de tri (défaut: timestamp)
 * - orderDirection: direction du tri (ASC/DESC, défaut: DESC)
 */
router.get('/', 
  logCrudAction('read', 'logs'),
  logController.getLogs,
  logCrudSuccess
);

/**
 * GET /api/logs/stats
 * Récupère les statistiques des logs
 * Query params:
 * - dateFrom: date de début (optionnel)
 * - dateTo: date de fin (optionnel)
 */
router.get('/stats',
  logCrudAction('read', 'log_stats'),
  logController.getLogStats,
  logCrudSuccess
);

/**
 * GET /api/logs/export
 * Exporte les logs au format CSV
 * Query params: mêmes que GET /logs
 */
router.get('/export',
  logCrudAction('export', 'logs'),
  logController.exportLogs,
  logCrudSuccess
);

/**
 * DELETE /api/logs/cleanup
 * Nettoie les anciens logs
 * Body:
 * - daysToKeep: nombre de jours à conserver (défaut: 90)
 */
router.delete('/cleanup',
  logCrudAction('cleanup', 'logs'),
  logController.cleanupLogs,
  logCrudSuccess
);

module.exports = router;
