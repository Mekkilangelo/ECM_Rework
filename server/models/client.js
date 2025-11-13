const { DataTypes } = require('sequelize');

/**
 * Modèle Client - Données spécifiques aux clients
 * Philosophie Synergia : ENUM → Tables de référence
 */
module.exports = (sequelize) => {
  const Client = sequelize.define('client', {
    node_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'nodes',
        key: 'id'
      },
      comment: '🔗 RELATION FONDAMENTALE : Référence au nœud parent'
    },
    client_code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true,
      comment: 'Code unique du client'
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Ville du client'
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'ref_country',
        key: 'name'
      },
      comment: 'Pays - FK vers ref_country.name (normalisé)'
    },
    client_group: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Groupe du client'
    },
    address: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Adresse du client'
    }
  }, {
    tableName: 'clients',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['client_code'],
        name: 'unique_client_code'
      },
      {
        fields: ['country'],
        name: 'fk_clients_country'
      }
    ]
  });

  Client.associate = function(models) {
    // 🔗 RELATION CRITIQUE : Chaque Client DOIT appartenir à un Node
    Client.belongsTo(models.node, { 
      foreignKey: 'node_id',
      as: 'node',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
    
    // Relation avec table de référence country
    Client.belongsTo(models.ref_country, {
      foreignKey: 'country',
      targetKey: 'name',
      as: 'countryRef',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  };

  return Client;
};