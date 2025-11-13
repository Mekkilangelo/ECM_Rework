const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les types de processus
 */
module.exports = (sequelize) => {
  const RefProcessType = sequelize.define('ref_process_type', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Type de processus - Clé primaire'
    }
  }, {
    tableName: 'ref_process_type',
    timestamps: false
  });

  RefProcessType.associate = function(models) {
    // ⚠️ TEMPORAIREMENT COMMENTÉ : models.trial n'existe pas encore
    // TODO: Décommenter après création de models/trial.js
    // RefProcessType.hasMany(models.trial, {
    //   foreignKey: 'process_type',
    //   sourceKey: 'name',
    //   as: 'trials'
    // });
  };

  return RefProcessType;
};
