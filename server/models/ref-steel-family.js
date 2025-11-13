const { DataTypes } = require('sequelize');

/**
 * Table de référence pour les familles d'acier
 * Remplace l'ancien ENUM family dans steels
 */
module.exports = (sequelize) => {
  const RefSteelFamily = sequelize.define('ref_steel_family', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
      comment: 'Nom de la famille d\'acier - Clé primaire'
    }
  }, {
    tableName: 'ref_steel_family',
    timestamps: false
  });

  RefSteelFamily.associate = function(models) {
    RefSteelFamily.hasMany(models.steel, {
      foreignKey: 'family',
      sourceKey: 'name',
      as: 'steels'
    });
  };

  return RefSteelFamily;
};
