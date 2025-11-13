const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les types de position
 */
module.exports = (sequelize) => {
  const RefPositionType = sequelize.define('ref_position_type', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Type de position - Clé primaire'
    }
  }, {
    tableName: 'ref_position_type',
    timestamps: false
  });

  RefPositionType.associate = function(models) {
    // ⚠️ TEMPORAIREMENT COMMENTÉ : models.trial n'existe pas encore
    // TODO: Décommenter après création de models/trial.js
    // RefPositionType.hasMany(models.trial, {
    //   foreignKey: 'position_type',
    //   sourceKey: 'name',
    //   as: 'trials'
    // });
  };

  return RefPositionType;
};
