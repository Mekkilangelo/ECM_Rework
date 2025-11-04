const { log } = require('../models');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Service de logging centralisé
 * =============================
 * 
 * Ce service permet de centraliser tous les logs de l'application :
 * - Actions utilisateurs (CRUD, connexions, etc.)
 * - Erreurs système
 * - Événements de sécurité
 * - Performance et monitoring
 */

class LoggingService {
  
  /**
   * Enregistre un log dans la base de données
   * @param {Object} logData - Données du log
   * @param {string} logData.level - Niveau du log (error, warning, info, success, debug)
   * @param {string} logData.action - Action effectuée
   * @param {string} logData.message - Message descriptif
   * @param {Object} [options] - Options additionnelles
   * @returns {Promise<Object>} Log créé
   */  async log(logData, options = {}) {
    try {
      const logEntry = {
        timestamp: new Date(),
        level: logData.level || 'info',
        action: logData.action,
        entity: logData.entity || null,
        entityId: logData.entityId || null,
        userId: logData.userId || options.userId || null,
        username: logData.username || options.username || null,
        message: logData.message,
        details: logData.details || null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
        sessionId: options.sessionId || null,
        requestId: options.requestId || uuidv4(),
        duration: logData.duration || null,
        errorCode: logData.errorCode || null,
        stackTrace: logData.stackTrace || null
      };

      const createdLog = await log.create(logEntry);
      
      // Log en console pour le développement
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Log enregistré', {
          level: logEntry.level,
          action: logEntry.action,
          message: logEntry.message,
          details: logEntry.details
        });
      }

      return createdLog;
    } catch (error) {
      logger.error('Erreur enregistrement log', { error: error.message });
      // Ne pas faire planter l'application si le logging échoue
      return null;
    }
  }

  /**
   * Log d'information
   */
  async info(action, message, options = {}) {
    return this.log({
      level: 'info',
      action,
      message,
      ...options
    }, options);
  }

  /**
   * Log de succès
   */
  async success(action, message, options = {}) {
    return this.log({
      level: 'success',
      action,
      message,
      ...options
    }, options);
  }

  /**
   * Log d'avertissement
   */
  async warning(action, message, options = {}) {
    return this.log({
      level: 'warning',
      action,
      message,
      ...options
    }, options);
  }

  /**
   * Log d'erreur
   */
  async error(action, message, error = null, options = {}) {
    const logData = {
      level: 'error',
      action,
      message,
      ...options
    };

    if (error) {
      logData.details = {
        errorName: error.name,
        errorMessage: error.message,
        ...logData.details
      };
      logData.stackTrace = error.stack;
    }

    return this.log(logData, options);
  }

  /**
   * Log de debug
   */
  async debug(action, message, options = {}) {
    return this.log({
      level: 'debug',
      action,
      message,
      ...options
    }, options);
  }

  /**
   * Log d'action CRUD
   */
  async logCrudAction(action, entity, entityId, userId, username, message, details = null, options = {}) {
    return this.log({
      level: 'info',
      action: `${entity}_${action}`,
      entity,
      entityId,
      userId,
      username,
      message,
      details
    }, options);
  }

  /**
   * Log de connexion utilisateur
   */
  async logUserLogin(userId, username, success = true, options = {}) {
    return this.log({
      level: success ? 'success' : 'warning',
      action: success ? 'user_login_success' : 'user_login_failed',
      userId: success ? userId : null,
      username,
      message: success ? 
        `Connexion réussie pour l'utilisateur ${username}` :
        `Échec de connexion pour l'utilisateur ${username}`,
      details: {
        loginSuccess: success,
        timestamp: new Date().toISOString()
      }
    }, options);
  }

  /**
   * Log de déconnexion utilisateur
   */
  async logUserLogout(userId, username, options = {}) {
    return this.log({
      level: 'info',
      action: 'user_logout',
      userId,
      username,
      message: `Déconnexion de l'utilisateur ${username}`,
      details: {
        logoutTimestamp: new Date().toISOString()
      }
    }, options);
  }

  /**
   * Log d'erreur de sécurité
   */
  async logSecurityEvent(action, message, details = null, options = {}) {
    return this.log({
      level: 'warning',
      action: `security_${action}`,
      message,
      details: {
        securityEvent: true,
        ...details
      }
    }, options);
  }

  /**
   * Récupère les logs avec pagination et filtres
   */
  async getLogs(filters = {}, pagination = {}) {
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
      } = filters;

      const {
        page = 1,
        limit = 50,
        orderBy = 'timestamp',
        orderDirection = 'DESC'
      } = pagination;

      const where = {};

      if (level) where.level = level;
      if (action) where.action = { [require('sequelize').Op.like]: `%${action}%` };
      if (entity) where.entity = entity;
      if (userId) where.userId = userId;
      if (username) where.username = { [require('sequelize').Op.like]: `%${username}%` };
      if (ipAddress) where.ipAddress = ipAddress;
      
      if (dateFrom || dateTo) {
        where.timestamp = {};
        if (dateFrom) where.timestamp[require('sequelize').Op.gte] = new Date(dateFrom);
        if (dateTo) where.timestamp[require('sequelize').Op.lte] = new Date(dateTo);
      }

      const offset = (page - 1) * limit;
      const result = await log.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[orderBy, orderDirection]]
      });

      return {
        logs: result.rows,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
        page: parseInt(page),
        limit: parseInt(limit),
        hasNextPage: page * limit < result.count,
        hasPrevPage: page > 1
      };
    } catch (error) {
      logger.error('Erreur récupération logs', { error: error.message });
      throw error;
    }
  }

  /**
   * Supprime les anciens logs (pour maintenance)
   */
  async cleanOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedCount = await log.destroy({
        where: {
          timestamp: {
            [require('sequelize').Op.lt]: cutoffDate
          }
        }
      });

      await this.info('log_cleanup', `Suppression de ${deletedCount} logs antérieurs à ${daysToKeep} jours`);
      
      return deletedCount;
    } catch (error) {
      await this.error('log_cleanup_error', 'Erreur lors du nettoyage des logs', error);
      throw error;
    }
  }

  /**
   * Obtient des statistiques sur les logs
   */
  async getLogStats(dateFrom = null, dateTo = null) {
    try {
      const where = {};
      
      if (dateFrom || dateTo) {
        where.timestamp = {};
        if (dateFrom) where.timestamp[require('sequelize').Op.gte] = new Date(dateFrom);
        if (dateTo) where.timestamp[require('sequelize').Op.lte] = new Date(dateTo);
      }

      const stats = await log.findAll({
        attributes: [
          'level',
          [require('sequelize').fn('COUNT', '*'), 'count']
        ],
        where,
        group: ['level'],
        raw: true
      });      const actionStats = await log.findAll({
        attributes: [
          'action',
          [require('sequelize').fn('COUNT', '*'), 'count']
        ],
        where,
        group: ['action'],
        order: [[require('sequelize').fn('COUNT', '*'), 'DESC']],
        limit: 10,
        raw: true
      });

      // Statistiques totales
      const totalLogs = await log.count({ where });
      
      // Compter les erreurs
      const errorCount = await log.count({ 
        where: { 
          ...where, 
          level: 'error' 
        } 
      });
      
      // Compter les avertissements
      const warningCount = await log.count({ 
        where: { 
          ...where, 
          level: 'warning' 
        } 
      });
      
      // Statistiques d'aujourd'hui
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await log.count({
        where: {
          timestamp: {
            [require('sequelize').Op.gte]: today
          }
        }
      });

      return {
        totalLogs,
        errorCount,
        warningCount,
        todayCount,
        levelStats: stats,
        topActions: actionStats
      };
    } catch (error) {
      logger.error('Erreur récupération statistiques logs', { error: error.message });
      throw error;
    }
  }
}

module.exports = new LoggingService();
