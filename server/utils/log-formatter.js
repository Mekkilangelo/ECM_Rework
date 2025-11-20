/**
 * Utilitaires de formatage des logs
 * Fournit des fonctions pour formatter les messages de log de manière cohérente
 */

const chalk = require('chalk');

/**
 * Formater une requête HTTP pour les logs
 */
const formatHttpRequest = (method, url, statusCode, duration, user) => {
  const methodColors = {
    GET: chalk.blue,
    POST: chalk.green,
    PUT: chalk.yellow,
    DELETE: chalk.red,
    PATCH: chalk.cyan
  };
  
  const methodColor = methodColors[method] || chalk.white;
  const statusColor = statusCode >= 500 ? chalk.red 
    : statusCode >= 400 ? chalk.yellow 
    : statusCode >= 300 ? chalk.cyan 
    : chalk.green;
  
  const durationColor = duration > 1000 ? chalk.red 
    : duration > 500 ? chalk.yellow 
    : chalk.green;
  
  let parts = [
    methodColor.bold(method.padEnd(6)),
    statusColor(`[${statusCode}]`),
    chalk.cyan(url),
    durationColor(`${duration}ms`)
  ];
  
  if (user && user.username) {
    parts.push(chalk.magenta(`👤 ${user.username}`));
  }
  
  return parts.join(' ');
};

/**
 * Formater une action CRUD pour les logs
 */
const formatCrudAction = (action, entity, entityId, username) => {
  const actionIcons = {
    create: '➕',
    read: '👁️ ',
    update: '✏️ ',
    delete: '🗑️ '
  };
  
  const actionColors = {
    create: chalk.green.bold,
    read: chalk.blue,
    update: chalk.yellow.bold,
    delete: chalk.red.bold
  };
  
  const icon = actionIcons[action] || '📝';
  const color = actionColors[action] || chalk.white;
  
  let message = `${icon} ${color(action.toUpperCase())} ${chalk.cyan(entity)}`;
  
  if (entityId) {
    message += chalk.gray(` #${entityId}`);
  }
  
  if (username) {
    message += ` ${chalk.magenta(`by @${username}`)}`;
  }
  
  return message;
};

/**
 * Formater une erreur pour les logs
 */
const formatError = (error, context = {}) => {
  const parts = [
    chalk.red.bold('ERROR:'),
    chalk.red(error.message)
  ];
  
  if (context.url) {
    parts.push(chalk.gray(`at ${context.url}`));
  }
  
  if (context.username) {
    parts.push(chalk.magenta(`by @${context.username}`));
  }
  
  return parts.join(' ');
};

/**
 * Formater une alerte de sécurité pour les logs
 */
const formatSecurityAlert = (type, message, ipAddress) => {
  const securityIcons = {
    auth_failed: '🔐',
    unauthorized: '🚫',
    forbidden: '⛔',
    suspicious: '⚠️ ',
    blocked: '🛑'
  };
  
  const icon = securityIcons[type] || '⚠️ ';
  
  return `${icon} ${chalk.red.bold('SECURITY')} ${chalk.yellow(message)} ${chalk.gray(`from ${ipAddress}`)}`;
};

/**
 * Formater les détails d'une base de données
 */
const formatDatabaseAction = (action, details) => {
  const dbIcons = {
    connect: '🔌',
    disconnect: '🔌',
    query: '💾',
    transaction: '📦',
    migrate: '🔄',
    error: '❌'
  };
  
  const icon = dbIcons[action] || '💾';
  
  return `${icon} ${chalk.blue.bold('DATABASE')} ${chalk.white(details)}`;
};

/**
 * Formater un message de démarrage/arrêt
 */
const formatLifecycle = (type, message, details = {}) => {
  const lifecycleIcons = {
    startup: '🚀',
    shutdown: '🛑',
    ready: '✅',
    error: '💥',
    warning: '⚠️ '
  };
  
  const lifecycleColors = {
    startup: chalk.blue.bold,
    shutdown: chalk.yellow.bold,
    ready: chalk.green.bold,
    error: chalk.red.bold,
    warning: chalk.yellow.bold
  };
  
  const icon = lifecycleIcons[type] || 'ℹ️ ';
  const color = lifecycleColors[type] || chalk.white;
  
  let formatted = `${icon} ${color(message)}`;
  
  if (Object.keys(details).length > 0) {
    formatted += chalk.gray(` ${JSON.stringify(details)}`);
  }
  
  return formatted;
};

module.exports = {
  formatHttpRequest,
  formatCrudAction,
  formatError,
  formatSecurityAlert,
  formatDatabaseAction,
  formatLifecycle
};
