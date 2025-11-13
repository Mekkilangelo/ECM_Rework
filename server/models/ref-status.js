const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les statuts de trials
 * Valeurs: OK, NOK, Pending
 */
module.exports = (sequelize) => {
  const RefStatus = sequelize.define('ref_status', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Statut - Clé primaire'
    }
  }, {
    tableName: 'ref_status',
    timestamps: false
  });

  RefStatus.associate = function(models) {
    // ⚠️ TEMPORAIREMENT COMMENTÉ : models.trial n'existe pas encore
    // TODO: Décommenter après création de models/trial.js
    // RefStatus.hasMany(models.trial, {
    //   foreignKey: 'status',
    //   sourceKey: 'name',
    //   as: 'trials'
    // });
  };

  return RefStatus;
};
