const { DataTypes } = require('sequelize');

/**
 * Modèle Trial Request (Demande d'essai)
 * Représente une demande d'essai associée à un client
 */
module.exports = (sequelize) => {
  const TrialRequest = sequelize.define('trial_request', {
    node_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'nodes',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      comment: '🔗 RELATION : Clé primaire et clé étrangère vers nodes.id'
    },
    request_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Numéro de la demande d\'essai (ex: TRQ_2024-01-15)'
    },
    request_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Date de la demande d\'essai'
    },
    commercial: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Nom du commercial responsable'
    }
  }, {
    tableName: 'trial_requests',
    timestamps: false,
    indexes: [
      {
        fields: ['request_number'],
        name: 'idx_request_number'
      },
      {
        fields: ['request_date'],
        name: 'idx_request_date'
      }
    ]
  });

  TrialRequest.associate = function(models) {
    // 🔗 RELATION : Chaque Trial Request appartient à un Node
    TrialRequest.belongsTo(models.node, { 
      foreignKey: 'node_id',
      as: 'node',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // 🔗 RELATION : Un Trial Request peut avoir plusieurs Contacts
    TrialRequest.hasMany(models.contact, {
      foreignKey: 'trial_request_node_id',
      sourceKey: 'node_id',
      as: 'contacts',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  return TrialRequest;
};
