const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les désignations de pièces
 * Remplace l'ancien ENUM designation dans parts
 * Valeurs: Gear, Hub, Clip, Tool, Misc, Housing, Ring, Shaft, Sample, Bushing, Piston, Other
 */
module.exports = (sequelize) => {
  const RefDesignation = sequelize.define('ref_designation', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Type de désignation - Clé primaire'
    }
  }, {
    tableName: 'ref_designation',
    timestamps: false
  });

  RefDesignation.associate = function(models) {
    RefDesignation.hasMany(models.part, {
      foreignKey: 'designation',
      sourceKey: 'name',
      as: 'parts'
    });
  };

  return RefDesignation;
};
