const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Log = sequelize.define('log', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    level: {
      type: DataTypes.ENUM('error', 'warning', 'info', 'success', 'debug'),
      allowNull: false,
      defaultValue: 'info'
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Type d\'action (login, logout, create, update, delete, etc.)'
    },
    entity: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Entité concernée (user, client, order, part, etc.)'
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID de l\'entité concernée'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID de l\'utilisateur qui a effectué l\'action'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Nom de l\'utilisateur (pour éviter les jointures)'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Message descriptif de l\'action'
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Détails additionnels en JSON (données modifiées, erreurs, etc.)'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'Adresse IP de l\'utilisateur (IPv4 ou IPv6)'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User-Agent du navigateur'
    },
    sessionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'ID de session pour tracer les actions liées'
    },
    requestId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      comment: 'ID unique de la requête pour le debugging'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Durée de l\'opération en millisecondes'
    },
    errorCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Code d\'erreur spécifique'
    },
    stackTrace: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Stack trace en cas d\'erreur'
    }
  }, {
    tableName: 'logs',
    timestamps: false, // On utilise notre propre timestamp
    indexes: [
      {
        name: 'idx_logs_timestamp',
        fields: ['timestamp']
      },
      {
        name: 'idx_logs_level',
        fields: ['level']
      },
      {
        name: 'idx_logs_action',
        fields: ['action']
      },
      {
        name: 'idx_logs_user',
        fields: ['userId', 'username']
      },
      {
        name: 'idx_logs_entity',
        fields: ['entity', 'entityId']
      },
      {
        name: 'idx_logs_ip',
        fields: ['ipAddress']
      }
    ]
  });

  return Log;
};
