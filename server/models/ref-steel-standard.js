const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les standards d'acier
 * Remplace l'ancien ENUM standard dans steels
 */
module.exports = (sequelize) => {
  const RefSteelStandard = sequelize.define('ref_steel_standard', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Nom du standard - Clé primaire'
    }
  }, {
    tableName: 'ref_steel_standard',
    timestamps: false
  });

  RefSteelStandard.associate = function(models) {
    RefSteelStandard.hasMany(models.steel, {
      foreignKey: 'standard',
      sourceKey: 'name',
      as: 'steels'
    });
  };

  return RefSteelStandard;
};
