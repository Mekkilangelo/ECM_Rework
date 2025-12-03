const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les types de montage
 */
module.exports = (sequelize) => {
  const RefMountingType = sequelize.define('ref_mounting_type', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Type de montage - Clé primaire'
    }
  }, {
    tableName: 'ref_mounting_type',
    timestamps: false
  });

  RefMountingType.associate = function(models) {
    // ⚠️ TEMPORAIREMENT COMMENTÉ : models.trial n'existe pas encore
    // TODO: Décommenter après création de models/trial.js
    // RefMountingType.hasMany(models.trial, {
    //   foreignKey: 'mounting_type',
    //   sourceKey: 'name',
    //   as: 'trials'
    // });
  };

  return RefMountingType;
};
