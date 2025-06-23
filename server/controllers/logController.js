const loggingService = require('../services/loggingService');
const apiResponse = require('../utils/apiResponse');

/**
 * Contrôleur pour la gestion des logs
 * ===================================
 * 
 * Endpoints pour consulter et gérer les logs du système
 */

class LogController {
  
  /**
   * Récupère la liste des logs avec pagination et filtres
   * GET /api/logs
   */
  async getLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        level,
        action,
        entity,
        userId,
        username,
        dateFrom,
        dateTo,
        ipAddress,
        orderBy = 'timestamp',
        orderDirection = 'DESC'
      } = req.query;

      // Validation des paramètres
      if (page < 1 || limit < 1 || limit > 500) {
        return apiResponse.error(res, 'Paramètres de pagination invalides', 400);
      }

      const filters = {
        level,
        action,
        entity,
        userId,
        username,
        dateFrom,
        dateTo,
        ipAddress
      };

      // Supprimer les filtres vides
      Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
      });

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy,
        orderDirection: orderDirection.toUpperCase()
      };      const result = await loggingService.getLogs(filters, pagination);

      // Log the access to logs
      await loggingService.info(
        'logs_accessed',
        `Logs accessed by ${req.user.username}`,
        {
          userId: req.user.id,
          username: req.user.username,
          details: {
            filters,
            pagination,
            resultCount: result.logs.length
          }
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId
        }
      );
      
      return apiResponse.success(res, result, 'Logs retrieved successfully');    } catch (error) {
      console.error('Error retrieving logs:', error);
      
      await loggingService.error(
        'logs_fetch_error',
        'Error retrieving logs',
        error,
        {
          userId: req.user?.id,
          username: req.user?.username
        }
      );
      
      return apiResponse.error(res, 'Error retrieving logs');
    }
  }

  /**
   * Récupère les statistiques des logs
   * GET /api/logs/stats
   */
  async getLogStats(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;

      const stats = await loggingService.getLogStats(dateFrom, dateTo);

      // Logger l'accès aux statistiques
      await loggingService.info(
        'log_stats_accessed',
        `Consultation des statistiques de logs par ${req.user.username}`,
        {
          userId: req.user.id,
          username: req.user.username,
          details: { dateFrom, dateTo }
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId
        }
      );      return apiResponse.success(res, stats, 'Statistics retrieved successfully');
    } catch (error) {
      console.error('Error retrieving statistics:', error);
      
      await loggingService.error(
        'log_stats_error',
        'Error retrieving statistics',
        error,
        {
          userId: req.user?.id,
          username: req.user?.username
        }
      );
      
      return apiResponse.error(res, 'Error retrieving statistics');
    }
  }

  /**
   * Exporte les logs au format CSV
   * GET /api/logs/export
   */
  async exportLogs(req, res) {
    try {
      const {
        level,
        action,
        entity,
        userId,
        username,
        dateFrom,
        dateTo,
        ipAddress
      } = req.query;

      const filters = {
        level,
        action,
        entity,
        userId,
        username,
        dateFrom,
        dateTo,
        ipAddress
      };

      // Supprimer les filtres vides
      Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
      });

      // Récupérer tous les logs correspondants (sans pagination pour l'export)
      const result = await loggingService.getLogs(filters, { limit: 10000 });

      // Convertir en CSV
      const csvHeader = 'Timestamp,Level,Action,Entity,EntityId,Username,Message,IP Address,User Agent\n';
      const csvRows = result.logs.map(log => {
        const timestamp = log.timestamp.toISOString();
        const level = log.level;
        const action = log.action;
        const entity = log.entity || '';
        const entityId = log.entityId || '';
        const username = log.username || '';
        const message = `"${log.message.replace(/"/g, '""')}"`;
        const ipAddress = log.ipAddress || '';
        const userAgent = `"${(log.userAgent || '').replace(/"/g, '""')}"`;
        
        return `${timestamp},${level},${action},${entity},${entityId},${username},${message},${ipAddress},${userAgent}`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      // Logger l'export
      await loggingService.info(
        'logs_exported',
        `Export de logs par ${req.user.username}`,
        {
          userId: req.user.id,
          username: req.user.username,
          details: {
            filters,
            exportedCount: result.logs.length
          }
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId
        }
      );

      // Définir les headers pour le téléchargement
      const filename = `logs_export_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.send(csvContent);    } catch (error) {
      console.error('Error exporting logs:', error);
      
      await loggingService.error(
        'logs_export_error',
        'Error exporting logs',
        error,
        {
          userId: req.user?.id,
          username: req.user?.username
        }
      );
      
      return apiResponse.error(res, 'Error exporting logs');
    }
  }

  /**
   * Nettoie les anciens logs
   * DELETE /api/logs/cleanup
   */
  async cleanupLogs(req, res) {
    try {
      const { daysToKeep = 90 } = req.body;

      if (daysToKeep < 1 || daysToKeep > 3650) {
        return apiResponse.error(res, 'Le nombre de jours doit être entre 1 et 3650', 400);
      }

      const deletedCount = await loggingService.cleanOldLogs(parseInt(daysToKeep));

      // Logger l'action de nettoyage
      await loggingService.warning(
        'logs_cleanup_manual',
        `Nettoyage manuel des logs par ${req.user.username}`,
        {
          userId: req.user.id,
          username: req.user.username,
          details: {
            daysToKeep: parseInt(daysToKeep),
            deletedCount
          }
        },
        {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          requestId: req.requestId
        }
      );      return apiResponse.success(res, 
        { deletedCount },
        `${deletedCount} logs supprimés avec succès`
      );
    } catch (error) {      console.error('Error cleaning up logs:', error);
      
      await loggingService.error(
        'logs_cleanup_error',
        'Error cleaning up logs',
        error,
        {
          userId: req.user?.id,
          username: req.user?.username
        }
      );
      
      return apiResponse.error(res, 'Error cleaning up logs');
    }
  }
}

module.exports = new LogController();
