const { DataTypes } = require('sequelize');

/**
 * Modèle Contact
 * Contacts associés aux demandes d'essai
 */
module.exports = (sequelize) => {
  const Contact = sequelize.define('contact', {
    contact_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      comment: 'Identifiant unique du contact'
    },
    trial_request_node_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'trial_requests',
        key: 'node_id'
      },
      comment: '🔗 RELATION : Référence au trial_request (via node_id)'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Nom du contact'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Email du contact'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Téléphone du contact'
    }
  }, {
    tableName: 'contacts',
    timestamps: false,
    indexes: [
      {
        fields: ['trial_request_node_id'],
        name: 'fk_trial_request_contacts'
      }
    ]
  });

  Contact.associate = function(models) {
    // 🔗 RELATION : Chaque Contact appartient à un Trial Request
    Contact.belongsTo(models.trial_request, { 
      foreignKey: 'trial_request_node_id',
      targetKey: 'node_id',
      as: 'trialRequest',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  return Contact;
};
